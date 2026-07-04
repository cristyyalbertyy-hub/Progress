import { useEffect, useState } from 'react';
import type { SubDiscipline } from '../data/course';
import { MAX_PROGRESS_LEVEL } from '../lib/progress-client';
import { useAuth } from '../context/AuthContext';
import { getFirebaseDb } from '../lib/firebase';
import {
  progressLevel,
  subscribePackageProgress,
} from '../lib/progress-client';
import {
  isSyncedPackage,
  RESOURCE_TYPES,
  toFirebaseItemKey,
} from '../data/packageProgress';

const SYNCED_PACKAGE_IDS = ['medical-biology', 'genetics'] as const;

type FirebaseMap = Record<
  string,
  { watch_count?: number; manual_level?: number; status?: string; resource?: string }
>;

export type SubProgressSummary = {
  consolidated: number;
  itemCount: number;
  percent: number;
};

export function useRemoteProgressCache() {
  const { user, configured, entitledPackageIds } = useAuth();
  const [cache, setCache] = useState<Record<string, FirebaseMap>>({});

  useEffect(() => {
    if (!configured || !user) {
      setCache({});
      return;
    }

    const entitledSynced = entitledPackageIds.filter((id) => isSyncedPackage(id));
    const syncedIds =
      entitledSynced.length > 0 ? entitledSynced : [...SYNCED_PACKAGE_IDS];

    const db = getFirebaseDb();
    const unsubscribes = syncedIds.map((packageId) =>
      subscribePackageProgress(db, user.uid, packageId, (map) => {
        setCache((prev) => ({ ...prev, [packageId]: map }));
      }),
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [configured, user, entitledPackageIds]);

  function summaryForSub(sub: SubDiscipline): SubProgressSummary {
    const itemIds = sub.chapters.flatMap((c) => c.items.map((i) => i.id));

    if (sub.packageId && isSyncedPackage(sub.packageId)) {
      const map = cache[sub.packageId] ?? {};
      let consolidated = 0;
      let cells = 0;
      let points = 0;
      for (const itemId of itemIds) {
        const firebaseItemKey = toFirebaseItemKey(sub.packageId, itemId);
        for (const resource of RESOURCE_TYPES) {
          cells += 1;
          const key = `${firebaseItemKey}/${resource}`;
          const level = progressLevel(resource, {
            ...map[key],
            resource,
          });
          points += level;
          if (level >= MAX_PROGRESS_LEVEL) consolidated += 1;
        }
      }
      const maxPoints = cells * MAX_PROGRESS_LEVEL;
      return {
        consolidated,
        itemCount: cells,
        percent: maxPoints ? Math.round((points / maxPoints) * 100) : 0,
      };
    }

    return { consolidated: 0, itemCount: itemIds.length, percent: 0 };
  }

  return { cache, summaryForSub };
}
