import { useCallback, useEffect, useState } from 'react';
import type { ProgressLevel, SubDiscipline } from '../data/course';
import {
  isSyncedPackage,
  MANUAL_RESOURCES,
  progressCellKey,
  RESOURCE_TYPES,
  toFirebaseItemKey,
  type ResourceType,
} from '../data/packageProgress';
import { useAuth } from '../context/AuthContext';
import { getFirebaseDb } from '../lib/firebase';
import {
  getManualCachedLevel,
  readManualProgressCache,
  setManualCachedLevel,
  writeManualProgressCache,
} from '../lib/manualProgressCache';
import {
  isPackageEntitled,
  loadPackageProgress,
  progressLevel,
  progressMapKey,
  subscribePackageProgress,
  recordManualLevel,
} from '../lib/progress-client';

const STORAGE_KEY = 'medical-science-y1-progress';

function loadLocalProgress(): Record<string, ProgressLevel> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProgressLevel>;
  } catch {
    return {};
  }
}

export function useHybridProgress(activeSubDiscipline?: SubDiscipline) {
  const { user, configured, entitledPackageIds } = useAuth();
  const [localProgress, setLocalProgress] = useState<Record<string, ProgressLevel>>(
    loadLocalProgress,
  );
  const [manualCache, setManualCache] = useState<Record<string, ProgressLevel>>(
    readManualProgressCache,
  );
  const [firebaseMap, setFirebaseMap] = useState<
    Record<string, { watch_count?: number; manual_level?: number; status?: string; resource?: string }>
  >({});
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const packageId = activeSubDiscipline?.packageId;
  const synced = Boolean(packageId && isSyncedPackage(packageId));
  const entitled = Boolean(
    packageId && isPackageEntitled(entitledPackageIds, packageId),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localProgress));
  }, [localProgress]);

  const syncManualCacheFromMap = useCallback(
    (map: typeof firebaseMap, pkgId: string) => {
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
    },
    [],
  );

  const reloadRemote = useCallback(async () => {
    if (!synced || !configured || !user || !packageId || !entitled) return;

    setLoadingRemote(true);
    try {
      const map = await loadPackageProgress(getFirebaseDb(), user.uid, packageId);
      setFirebaseMap(map);
      syncManualCacheFromMap(map, packageId);
      setSaveError(null);
    } catch (err) {
      console.warn('Could not load remote progress:', err);
    } finally {
      setLoadingRemote(false);
    }
  }, [synced, configured, user, packageId, entitled, syncManualCacheFromMap]);

  useEffect(() => {
    if (!synced || !configured || !user || !packageId || !entitled) {
      setFirebaseMap({});
      setLoadingRemote(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    setLoadingRemote(true);

    void (async () => {
      try {
        unsubscribe = subscribePackageProgress(
          getFirebaseDb(),
          user.uid,
          packageId,
          (map) => {
            if (!active) return;
            setFirebaseMap(map);
            syncManualCacheFromMap(map, packageId);
            setLoadingRemote(false);
            setSaveError(null);
          },
          (err) => {
            console.warn('Progress subscription error:', err);
            if (!active) return;
            void loadPackageProgress(getFirebaseDb(), user!.uid, packageId)
              .then((map) => {
                if (!active) return;
                setFirebaseMap(map);
                syncManualCacheFromMap(map, packageId);
              })
              .catch((loadErr) => {
                console.warn('Progress fallback load failed:', loadErr);
              })
              .finally(() => {
                if (active) setLoadingRemote(false);
              });
          },
        );
      } catch (err) {
        console.warn('Could not subscribe to progress:', err);
        if (!active) return;
        void reloadRemote();
      }
    })();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void reloadRemote();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      unsubscribe?.();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [synced, configured, user, packageId, entitled, reloadRemote, syncManualCacheFromMap]);

  const getLegacyLevel = useCallback(
    (itemId: string): ProgressLevel => localProgress[itemId] ?? 0,
    [localProgress],
  );

  const getResourceLevel = useCallback(
    (itemId: string, resource: ResourceType): ProgressLevel => {
      if (!synced || !packageId) return getLegacyLevel(itemId);
      const firebaseItemKey = toFirebaseItemKey(packageId, itemId);
      const mapKey = progressMapKey(firebaseItemKey, resource);
      const remoteData = firebaseMap[mapKey] ?? {};
      const remoteLevel = progressLevel(resource, { ...remoteData, resource });

      if (!MANUAL_RESOURCES.includes(resource as 'I' | 'Q')) {
        return remoteLevel;
      }

      const cached = getManualCachedLevel(manualCache, packageId, firebaseItemKey, resource);
      return Math.max(remoteLevel, cached ?? 0) as ProgressLevel;
    },
    [synced, packageId, firebaseMap, manualCache, getLegacyLevel],
  );

  const cycleLegacyItem = useCallback((itemId: string) => {
    setLocalProgress((prev) => {
      const current = prev[itemId] ?? 0;
      const next = ((current + 1) % 4) as ProgressLevel;
      return { ...prev, [itemId]: next };
    });
  }, []);

  const cycleManualResource = useCallback(
    async (itemId: string, resource: 'I' | 'Q') => {
      if (!synced || !packageId || !user || !entitled) return;

      const firebaseItemKey = toFirebaseItemKey(packageId, itemId);
      const current = getResourceLevel(itemId, resource);
      const next = ((current + 1) % 4) as ProgressLevel;
      const mapKey = progressMapKey(firebaseItemKey, resource);

      setManualCache((prev) => {
        const updated = setManualCachedLevel(prev, packageId, firebaseItemKey, resource, next);
        writeManualProgressCache(updated);
        return updated;
      });

      setFirebaseMap((prev) => ({
        ...prev,
        [mapKey]: {
          ...(prev[mapKey] ?? {}),
          manual_level: next,
          resource,
        },
      }));

      setSaveError(null);

      try {
        await recordManualLevel(
          getFirebaseDb(),
          user.uid,
          packageId,
          firebaseItemKey,
          resource,
          next,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not save manual progress';
        console.warn('Could not save manual progress:', err);
        setSaveError(message);
      }
    },
    [synced, packageId, user, entitled, getResourceLevel],
  );

  const resetLocalAll = useCallback(() => {
    setLocalProgress({});
  }, []);

  const progressSummary = useCallback(
    (sub: SubDiscipline) => {
      const itemIds = sub.chapters.flatMap((c) => c.items.map((i) => i.id));
      if (sub.packageId && isSyncedPackage(sub.packageId)) {
        let consolidated = 0;
        let cells = 0;
        for (const itemId of itemIds) {
          for (const resource of RESOURCE_TYPES) {
            cells += 1;
            if (getResourceLevel(itemId, resource) === 3) consolidated += 1;
          }
        }
        return { consolidated, itemCount: cells, itemTopics: itemIds.length };
      }

      const consolidated = itemIds.filter((id) => getLegacyLevel(id) === 3).length;
      return { consolidated, itemCount: itemIds.length, itemTopics: itemIds.length };
    },
    [getLegacyLevel, getResourceLevel],
  );

  const flatProgressForHeader = useCallback((): Record<string, ProgressLevel> => {
    if (!activeSubDiscipline?.packageId || !isSyncedPackage(activeSubDiscipline.packageId)) {
      return localProgress;
    }
    const out: Record<string, ProgressLevel> = {};
    for (const chapter of activeSubDiscipline.chapters) {
      for (const item of chapter.items) {
        for (const resource of RESOURCE_TYPES) {
          out[progressCellKey(item.id, resource)] = getResourceLevel(item.id, resource);
        }
      }
    }
    return out;
  }, [activeSubDiscipline, localProgress, getResourceLevel]);

  return {
    synced,
    loadingRemote,
    canEditRemote: entitled,
    saveError,
    getLegacyLevel,
    getResourceLevel,
    cycleLegacyItem,
    cycleManualResource,
    resetLocalAll,
    progressSummary,
    flatProgressForHeader,
    reloadRemote,
  };
}
