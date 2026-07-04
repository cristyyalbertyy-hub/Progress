import type { ProgressLevel } from '../data/course';
import type { ResourceType } from '../data/packageProgress';
import { progressMapKey } from './progress-client';

const STORAGE_KEY = 'studio9-manual-progress-v1';

export function readManualProgressCache(): Record<string, ProgressLevel> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProgressLevel>;
  } catch {
    return {};
  }
}

export function writeManualProgressCache(map: Record<string, ProgressLevel>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function manualCacheKey(
  packageId: string,
  firebaseItemKey: string,
  resource: ResourceType,
): string {
  return `${packageId}::${progressMapKey(firebaseItemKey, resource)}`;
}

export function getManualCachedLevel(
  cache: Record<string, ProgressLevel>,
  packageId: string,
  firebaseItemKey: string,
  resource: ResourceType,
): ProgressLevel | undefined {
  return cache[manualCacheKey(packageId, firebaseItemKey, resource)];
}

export function setManualCachedLevel(
  cache: Record<string, ProgressLevel>,
  packageId: string,
  firebaseItemKey: string,
  resource: ResourceType,
  level: ProgressLevel,
): Record<string, ProgressLevel> {
  return {
    ...cache,
    [manualCacheKey(packageId, firebaseItemKey, resource)]: level,
  };
}
