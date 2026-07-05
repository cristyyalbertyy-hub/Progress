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
import { useProgressSync } from '../context/ProgressSyncContext';
import { getFirebaseDb } from '../lib/firebase';
import { getManualCachedLevel } from '../lib/manualProgressCache';
import {
  isPackageEntitled,
  progressLevel,
  progressMapKey,
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
  const { user, entitledPackageIds } = useAuth();
  const {
    manualCache,
    getPackageMap,
    isLoadingPackage,
    reloadPackage,
    applyOptimisticCell,
    setManualLevelOptimistic,
  } = useProgressSync();

  const [localProgress, setLocalProgress] = useState<Record<string, ProgressLevel>>(
    loadLocalProgress,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const packageId = activeSubDiscipline?.packageId;
  const synced = Boolean(packageId && isSyncedPackage(packageId));
  const entitled = Boolean(
    packageId && isPackageEntitled(entitledPackageIds, packageId),
  );
  const firebaseMap = packageId ? getPackageMap(packageId) : {};
  const loadingRemote = Boolean(packageId && isLoadingPackage(packageId));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localProgress));
  }, [localProgress]);

  const reloadRemote = useCallback(async () => {
    if (!synced || !packageId) return;
    await reloadPackage(packageId);
  }, [synced, packageId, reloadPackage]);

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

      setManualLevelOptimistic(packageId, firebaseItemKey, resource, next);

      applyOptimisticCell(packageId, mapKey, {
        ...(firebaseMap[mapKey] ?? {}),
        manual_level: next,
        resource,
      });

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
    [
      synced,
      packageId,
      user,
      entitled,
      getResourceLevel,
      firebaseMap,
      setManualLevelOptimistic,
      applyOptimisticCell,
    ],
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
