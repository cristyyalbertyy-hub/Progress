import { useCallback, useEffect, useState } from 'react';
import type { ProgressLevel } from '../data/course';

const STORAGE_KEY = 'medical-science-y1-progress';

function loadProgress(): Record<string, ProgressLevel> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Record<string, ProgressLevel>>(loadProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const cycleItem = useCallback((itemId: string) => {
    setProgress((prev) => {
      const current = prev[itemId] ?? 0;
      const next = ((current + 1) % 4) as ProgressLevel;
      return { ...prev, [itemId]: next };
    });
  }, []);

  const resetAll = useCallback(() => {
    setProgress({});
  }, []);

  const getLevel = useCallback(
    (itemId: string): ProgressLevel => progress[itemId] ?? 0,
    [progress],
  );

  return { progress, cycleItem, resetAll, getLevel };
}
