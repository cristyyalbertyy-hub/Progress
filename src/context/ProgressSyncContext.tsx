import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ProgressLevel, SubDiscipline } from '../data/course';
import { percentFromPoints } from '../data/course';
import {
  isSyncedPackage,
  MANUAL_RESOURCES,
  RESOURCE_TYPES,
  SYNCED_PACKAGE_IDS,
  toFirebaseItemKey,
  packageIdForSub,
  type ResourceType,
} from '../data/packageProgress';
import { useAuth } from './AuthContext';
import { getFirebaseDb } from '../lib/firebase';
import {
  getManualCachedLevel,
  readManualProgressCache,
  setManualCachedLevel,
  writeManualProgressCache,
} from '../lib/manualProgressCache';
import {
  loadPackageProgress,
  MAX_PROGRESS_LEVEL,
  progressLevel,
  subscribePackageProgress,
} from '../lib/progress-client';


const MANUAL_PROGRESS_EVENT = 'studio9-manual-progress';

export type FirebaseProgressMap = Record<
  string,
  { watch_count?: number; manual_level?: number; status?: string; resource?: string }
>;

export type SubProgressSummary = {
  consolidated: number;
  itemCount: number;
  percent: number;
};

type ProgressSyncContextValue = {
  cache: Record<string, FirebaseProgressMap>;
  manualCache: Record<string, ProgressLevel>;
  isLoadingPackage: (packageId: string) => boolean;
  getPackageMap: (packageId: string) => FirebaseProgressMap;
  reloadPackage: (packageId: string) => Promise<void>;
  reloadAllSynced: () => Promise<void>;
  applyOptimisticCell: (
    packageId: string,
    mapKey: string,
    data: FirebaseProgressMap[string],
  ) => void;
  setManualLevelOptimistic: (
    packageId: string,
    firebaseItemKey: string,
    resource: 'I' | 'Q',
    level: ProgressLevel,
  ) => void;
  summaryForSub: (sub: SubDiscipline) => SubProgressSummary;
};

const ProgressSyncContext = createContext<ProgressSyncContextValue | null>(null);

export function notifyManualProgressChanged() {
  window.dispatchEvent(new Event(MANUAL_PROGRESS_EVENT));
}

function cellLevel(
  packageId: string,
  itemId: string,
  resource: ResourceType,
  map: FirebaseProgressMap,
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

export function ProgressSyncProvider({ children }: { children: ReactNode }) {
  const { user, configured, entitledPackageIds } = useAuth();
  const [cache, setCache] = useState<Record<string, FirebaseProgressMap>>({});
  const [manualCache, setManualCache] = useState(readManualProgressCache);
  const [loadingPackages, setLoadingPackages] = useState<Record<string, boolean>>({});

  const syncedPackageIds = useMemo(() => {
    const entitledSynced = entitledPackageIds.filter((id) => isSyncedPackage(id));
    return entitledSynced.length > 0 ? entitledSynced : [...SYNCED_PACKAGE_IDS];
  }, [entitledPackageIds]);

  const setPackageLoading = useCallback((packageId: string, loading: boolean) => {
    setLoadingPackages((prev) => {
      if (prev[packageId] === loading) return prev;
      return { ...prev, [packageId]: loading };
    });
  }, []);

  const syncManualCacheFromMap = useCallback((map: FirebaseProgressMap, pkgId: string) => {
    setManualCache((prev) => {
      let next = prev;
      for (const [key, data] of Object.entries(map)) {
        const resource = data.resource as ResourceType | undefined;
        if (!resource || !MANUAL_RESOURCES.includes(resource as 'I' | 'Q')) continue;
        const slash = key.lastIndexOf('/');
        if (slash <= 0) continue;
        const itemKey = key.slice(0, slash);
        const level = progressLevel(resource, data);
        next = setManualCachedLevel(next, pkgId, itemKey, resource, level);
      }
      writeManualProgressCache(next);
      return next;
    });
  }, []);

  const reloadPackage = useCallback(
    async (packageId: string) => {
      if (!configured || !user || !isSyncedPackage(packageId)) return;

      setPackageLoading(packageId, true);
      try {
        const map = await loadPackageProgress(getFirebaseDb(), user.uid, packageId);
        setCache((prev) => ({ ...prev, [packageId]: map }));
        syncManualCacheFromMap(map, packageId);
      } catch (err) {
        console.warn('Could not load remote progress:', packageId, err);
      } finally {
        setPackageLoading(packageId, false);
      }
    },
    [configured, user, setPackageLoading, syncManualCacheFromMap],
  );

  const reloadAllSynced = useCallback(async () => {
    await Promise.all(syncedPackageIds.map((id) => reloadPackage(id)));
  }, [syncedPackageIds, reloadPackage]);

  const refreshManualCache = useCallback(() => {
    setManualCache(readManualProgressCache());
  }, []);

  useEffect(() => {
    const onManual = () => refreshManualCache();
    window.addEventListener(MANUAL_PROGRESS_EVENT, onManual);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshManualCache();
        void reloadAllSynced();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(MANUAL_PROGRESS_EVENT, onManual);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshManualCache, reloadAllSynced]);

  useEffect(() => {
    if (!configured || !user) {
      setCache({});
      setLoadingPackages({});
      return;
    }

    let active = true;
    const unsubscribes: (() => void)[] = [];
    const db = getFirebaseDb();

    for (const packageId of syncedPackageIds) {
      setPackageLoading(packageId, true);

      const applyMap = (map: FirebaseProgressMap) => {
        if (!active) return;
        setCache((prev) => ({ ...prev, [packageId]: map }));
        syncManualCacheFromMap(map, packageId);
        setPackageLoading(packageId, false);
      };

      const fallbackLoad = () => {
        if (!active) return;
        void loadPackageProgress(db, user.uid, packageId)
          .then(applyMap)
          .catch((loadErr) => {
            console.warn('Progress fallback load failed:', packageId, loadErr);
          })
          .finally(() => {
            if (active) setPackageLoading(packageId, false);
          });
      };

      try {
        const unsub = subscribePackageProgress(
          db,
          user.uid,
          packageId,
          applyMap,
          (err) => {
            console.warn('Progress subscription error:', packageId, err);
            fallbackLoad();
          },
        );
        unsubscribes.push(unsub);
      } catch (err) {
        console.warn('Could not subscribe to progress:', packageId, err);
        fallbackLoad();
      }
    }

    return () => {
      active = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [configured, user, syncedPackageIds, setPackageLoading, syncManualCacheFromMap]);

  const getPackageMap = useCallback(
    (packageId: string) => cache[packageId] ?? {},
    [cache],
  );

  const isLoadingPackage = useCallback(
    (packageId: string) => Boolean(loadingPackages[packageId]),
    [loadingPackages],
  );

  const applyOptimisticCell = useCallback(
    (packageId: string, mapKey: string, data: FirebaseProgressMap[string]) => {
      setCache((prev) => ({
        ...prev,
        [packageId]: {
          ...(prev[packageId] ?? {}),
          [mapKey]: {
            ...(prev[packageId]?.[mapKey] ?? {}),
            ...data,
          },
        },
      }));
    },
    [],
  );

  const setManualLevelOptimistic = useCallback(
    (
      packageId: string,
      firebaseItemKey: string,
      resource: 'I' | 'Q',
      level: ProgressLevel,
    ) => {
      setManualCache((prev) => {
        const updated = setManualCachedLevel(prev, packageId, firebaseItemKey, resource, level);
        writeManualProgressCache(updated);
        notifyManualProgressChanged();
        return updated;
      });
    },
    [],
  );

  const summaryForSub = useCallback(
    (sub: SubDiscipline): SubProgressSummary => {
      const itemIds = sub.chapters.flatMap((c) => c.items.map((i) => i.id));
      const pkgId = packageIdForSub(sub);

      if (isSyncedPackage(pkgId)) {
        const map = cache[pkgId] ?? {};
        let consolidated = 0;
        let cells = 0;
        let points = 0;
        for (const itemId of itemIds) {
          for (const resource of RESOURCE_TYPES) {
            cells += 1;
            const level = cellLevel(pkgId, itemId, resource, map, manualCache);
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
    },
    [cache, manualCache],
  );

  const value = useMemo(
    (): ProgressSyncContextValue => ({
      cache,
      manualCache,
      isLoadingPackage,
      getPackageMap,
      reloadPackage,
      reloadAllSynced,
      applyOptimisticCell,
      setManualLevelOptimistic,
      summaryForSub,
    }),
    [
      cache,
      manualCache,
      isLoadingPackage,
      getPackageMap,
      reloadPackage,
      reloadAllSynced,
      applyOptimisticCell,
      setManualLevelOptimistic,
      summaryForSub,
    ],
  );

  return (
    <ProgressSyncContext.Provider value={value}>{children}</ProgressSyncContext.Provider>
  );
}

export function useProgressSync(): ProgressSyncContextValue {
  const ctx = useContext(ProgressSyncContext);
  if (!ctx) {
    throw new Error('useProgressSync must be used within ProgressSyncProvider');
  }
  return ctx;
}
