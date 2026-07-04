import { useCallback, useEffect, useState } from 'react';
import type { ProgressLevel, SubDiscipline } from '../data/course';
import {
  isSyncedPackage,
  progressCellKey,
  RESOURCE_TYPES,
  toFirebaseItemKey,
  type ResourceType,
} from '../data/packageProgress';
import { useAuth } from '../context/AuthContext';
import { getFirebaseDb } from '../lib/firebase';
import {
  firebaseMapToCellLevels,
  isPackageEntitled,
  loadPackageProgress,
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
  const [firebaseMap, setFirebaseMap] = useState<
    Record<string, { watch_count?: number; manual_level?: number; status?: string; resource?: string }>
  >({});
  const [loadingRemote, setLoadingRemote] = useState(false);

  const packageId = activeSubDiscipline?.packageId;
  const synced = Boolean(packageId && isSyncedPackage(packageId));
  const entitled = Boolean(
    packageId && isPackageEntitled(entitledPackageIds, packageId),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localProgress));
  }, [localProgress]);

  const reloadRemote = useCallback(async () => {
    if (!synced || !configured || !user || !packageId) {
      setFirebaseMap({});
      return;
    }

    if (!entitled) {
      setFirebaseMap({});
      return;
    }

    setLoadingRemote(true);
    try {
      const map = await loadPackageProgress(getFirebaseDb(), user.uid, packageId);
      setFirebaseMap(map);
    } catch (err) {
      console.warn('Could not load remote progress:', err);
      setFirebaseMap({});
    } finally {
      setLoadingRemote(false);
    }
  }, [synced, configured, user, packageId, entitled]);

  useEffect(() => {
    if (!synced || !configured || !user || !packageId) {
      setFirebaseMap({});
      setLoadingRemote(false);
      return;
    }

    if (!entitled) {
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
            setLoadingRemote(false);
          },
          () => {
            if (!active) return;
            setFirebaseMap({});
            setLoadingRemote(false);
          },
        );
      } catch (err) {
        console.warn('Could not subscribe to progress:', err);
        if (!active) return;
        setFirebaseMap({});
        setLoadingRemote(false);
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
  }, [synced, configured, user, packageId, entitled, reloadRemote]);

  const getLegacyLevel = useCallback(
    (itemId: string): ProgressLevel => localProgress[itemId] ?? 0,
    [localProgress],
  );

  const getResourceLevel = useCallback(
    (itemId: string, resource: ResourceType): ProgressLevel => {
      if (!synced || !packageId) return getLegacyLevel(itemId);
      const firebaseItemKey = toFirebaseItemKey(packageId, itemId);
      const levels = firebaseMapToCellLevels(firebaseMap, firebaseItemKey);
      return levels[resource];
    },
    [synced, packageId, firebaseMap, getLegacyLevel],
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

      setFirebaseMap((prev) => ({
        ...prev,
        [`${firebaseItemKey}/${resource}`]: {
          ...(prev[`${firebaseItemKey}/${resource}`] ?? {}),
          manual_level: next,
          resource,
        },
      }));

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
        console.warn('Could not save manual progress:', err);
        void reloadRemote();
      }
    },
    [synced, packageId, user, entitled, getResourceLevel, reloadRemote],
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
