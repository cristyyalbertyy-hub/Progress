import { useEffect, useState } from 'react';
import type { SubDiscipline } from '../data/course';
import { useAuth } from '../context/AuthContext';
import { getFirebaseDb } from '../lib/firebase';
import {
  loadPackageProgress,
  progressLevel,
} from '../lib/progress-client';
import {
  isSyncedPackage,
  RESOURCE_TYPES,
  toFirebaseItemKey,
} from '../data/packageProgress';

type FirebaseMap = Record<
  string,
  { watch_count?: number; manual_level?: number; status?: string; resource?: string }
>;

export function useRemoteProgressCache() {
  const { user, configured, entitledPackageIds } = useAuth();
  const [cache, setCache] = useState<Record<string, FirebaseMap>>({});

  useEffect(() => {
    if (!configured || !user) {
      setCache({});
      return;
    }

    let cancelled = false;

    (async () => {
      const syncedIds = entitledPackageIds.filter((id) => isSyncedPackage(id));
      const entries = await Promise.all(
        syncedIds.map(async (packageId) => {
          try {
            const map = await loadPackageProgress(getFirebaseDb(), user.uid, packageId);
            return [packageId, map] as const;
          } catch {
            return [packageId, {}] as const;
          }
        }),
      );

      if (cancelled) return;
      setCache(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, [configured, user, entitledPackageIds]);

  function summaryForSub(sub: SubDiscipline): { consolidated: number; itemCount: number } {
    const itemIds = sub.chapters.flatMap((c) => c.items.map((i) => i.id));

    if (sub.packageId && isSyncedPackage(sub.packageId)) {
      const map = cache[sub.packageId] ?? {};
      let consolidated = 0;
      let cells = 0;
      for (const itemId of itemIds) {
        const firebaseItemKey = toFirebaseItemKey(sub.packageId, itemId);
        for (const resource of RESOURCE_TYPES) {
          cells += 1;
          const key = `${firebaseItemKey}/${resource}`;
          const level = progressLevel(resource, {
            ...map[key],
            resource,
          });
          if (level === 3) consolidated += 1;
        }
      }
      return { consolidated, itemCount: cells };
    }

    return { consolidated: 0, itemCount: itemIds.length };
  }

  return { cache, summaryForSub };
}
