import { useProgressSync } from '../context/ProgressSyncContext';

export type { SubProgressSummary } from '../context/ProgressSyncContext';
export { notifyManualProgressChanged } from '../context/ProgressSyncContext';

/** @deprecated Prefer useProgressSync(); kept for a thin import surface. */
export function useRemoteProgressCache() {
  const { cache, summaryForSub } = useProgressSync();
  return { cache, summaryForSub };
}
