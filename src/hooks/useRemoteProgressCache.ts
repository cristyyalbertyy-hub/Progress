import { useCallback, useEffect, useState } from 'react';
import type { ProgressLevel, SubDiscipline } from '../data/course';
import { percentFromPoints } from '../data/course';
import { MAX_PROGRESS_LEVEL } from '../lib/progress-client';
import { useAuth } from '../context/AuthContext';
import { getFirebaseDb } from '../lib/firebase';
import {
  progressLevel,
  subscribePackageProgress,
} from '../lib/progress-client';
import {
  getManualCachedLevel,
  readManualProgressCache,
} from '../lib/manualProgressCache';
import {
  isSyncedPackage,
  MANUAL_RESOURCES,
  RESOURCE_TYPES,
  toFirebaseItemKey,
  type ResourceType,
} from '../data/packageProgress';

const SYNCED_PACKAGE_IDS = ['medical-biology', 'genetics'] as const;
const MANUAL_PROGRESS_EVENT = 'studio9-manual-progress';

type FirebaseMap = Record<
  string,
  { watch_count?: number; manual_level?: number; status?: string; resource?: string }
>;

export type SubProgressSummary = {
  consolidated: number;
  itemCount: number;
  percent: number;
};

function cellLevel(
  packageId: string,
  itemId: string,
  resource: ResourceType,
  map: FirebaseMap,
  manualCache: Record<string, ProgressLevel>,
): ProgressLevel {
  const firebaseItemKey = toFirebaseItemKey(packageId, itemId);
  const key = `${firebaseItemKey}/${resource}`;
  const remoteLevel = progressLevel(resource, { ...map[key], resource });

  if (MANUAL_RESOURCES.includes(resource as 'I' | 'Q')) {
    const cached = getManualCachedLevel(manualCache, packageId, firebaseItemKey, resource);
    return Math.max(remoteLevel, cached ?? 0) as ProgressLevel;
  }

  return remoteLevel;
}

export function useRemoteProgressCache() {
  const { user, configured, entitledPackageIds } = useAuth();
  const [cache, setCache] = useState<Record<string, FirebaseMap>>({});
  const [manualCache, setManualCache] = useState(readManualProgressCache);

  const refreshManualCache = useCallback(() => {
    setManualCache(readManualProgressCache());
  }, []);

  useEffect(() => {
    const onManual = () => refreshManualCache();
    window.addEventListener(MANUAL_PROGRESS_EVENT, onManual);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshManualCache();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(MANUAL_PROGRESS_EVENT, onManual);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshManualCache]);

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
        for (const resource of RESOURCE_TYPES) {
          cells += 1;
          const level = cellLevel(sub.packageId, itemId, resource, map, manualCache);
          points += level;
          if (level >= MAX_PROGRESS_LEVEL) consolidated += 1;
        }
      }
      const maxPoints = cells * MAX_PROGRESS_LEVEL;
      return {
        consolidated,
        itemCount: cells,
        percent: percentFromPoints(points, maxPoints),
      };
    }

    return { consolidated: 0, itemCount: itemIds.length, percent: 0 };
  }

  return { cache, summaryForSub };
}

/** Notify sidebar cache after manual level changes in the content panel. */
export function notifyManualProgressChanged() {
  window.dispatchEvent(new Event(MANUAL_PROGRESS_EVENT));
}
