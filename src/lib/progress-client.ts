import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import type { ProgressLevel } from '../data/course';
import {
  AUTO_RESOURCES,
  MANUAL_RESOURCES,
  type ResourceType,
} from '../data/packageProgress';

export const MAX_PROGRESS_LEVEL = 3;

export function progressDocId(
  userId: string,
  packageId: string,
  itemKey: string,
  resource: ResourceType,
): string {
  const safeKey = `${itemKey}/${resource}`.replace(/\//g, '__');
  return `${userId}_${packageId}_${safeKey}`;
}

export function progressMapKey(itemKey: string, resource: ResourceType): string {
  return `${itemKey}/${resource}`;
}

export function levelFromWatchCount(watchCount?: number | null): ProgressLevel {
  const n = typeof watchCount === 'number' ? watchCount : 0;
  return Math.min(3, Math.max(0, n)) as ProgressLevel;
}

export function levelFromManual(manualLevel?: number | null): ProgressLevel {
  const n = typeof manualLevel === 'number' ? manualLevel : 0;
  return Math.min(3, Math.max(0, n)) as ProgressLevel;
}

export function progressLevel(
  resource: ResourceType,
  data: {
    watch_count?: number;
    manual_level?: number;
    status?: string;
    resource?: string;
  } = {},
): ProgressLevel {
  if (AUTO_RESOURCES.includes(resource)) {
    return levelFromWatchCount(data.watch_count);
  }
  if (MANUAL_RESOURCES.includes(resource)) {
    return levelFromManual(data.manual_level);
  }
  return data.status === 'completed' ? 1 : 0;
}

export async function loadPackageProgress(
  db: import('firebase/firestore').Firestore,
  userId: string,
  packageId: string,
): Promise<
  Record<string, { watch_count?: number; manual_level?: number; status?: string; resource?: string }>
> {
  const snap = await getDocs(
    query(
      collection(db, 'progress'),
      where('user_id', '==', userId),
      where('package_id', '==', packageId),
    ),
  );

  const map: Record<
    string,
    { watch_count?: number; manual_level?: number; status?: string; resource?: string }
  > = {};

  snap.forEach((d) => {
    const data = d.data();
    map[progressMapKey(data.item_key, data.resource as ResourceType)] = {
      watch_count: data.watch_count,
      manual_level: data.manual_level,
      status: data.status,
      resource: data.resource,
    };
  });

  return map;
}

export function subscribePackageProgress(
  db: import('firebase/firestore').Firestore,
  userId: string,
  packageId: string,
  onData: (
    map: Record<
      string,
      { watch_count?: number; manual_level?: number; status?: string; resource?: string }
    >,
  ) => void,
  onError?: (err: unknown) => void,
): () => void {
  const q = query(
    collection(db, 'progress'),
    where('user_id', '==', userId),
    where('package_id', '==', packageId),
  );

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<
        string,
        { watch_count?: number; manual_level?: number; status?: string; resource?: string }
      > = {};
      snap.forEach((d) => {
        const data = d.data();
        map[progressMapKey(data.item_key, data.resource as ResourceType)] = {
          watch_count: data.watch_count,
          manual_level: data.manual_level,
          status: data.status,
          resource: data.resource,
        };
      });
      onData(map);
    },
    (err) => {
      console.warn('Progress subscription error:', err);
      onError?.(err);
    },
  );
}

export async function recordManualLevel(
  db: import('firebase/firestore').Firestore,
  userId: string,
  packageId: string,
  itemKey: string,
  resource: 'I' | 'Q',
  level: ProgressLevel,
): Promise<ProgressLevel> {
  const safeLevel = Math.min(MAX_PROGRESS_LEVEL, Math.max(0, level)) as ProgressLevel;
  const id = progressDocId(userId, packageId, itemKey, resource);
  const ref = doc(db, 'progress', id);

  try {
    await setDoc(
      ref,
      {
        user_id: userId,
        package_id: packageId,
        item_key: itemKey,
        resource,
        tracking: 'manual',
        manual_level: safeLevel,
        status: safeLevel > 0 ? 'completed' : 'started',
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save manual progress';
    throw new Error(message);
  }

  return safeLevel;
}

export async function loadActiveEntitlements(
  db: import('firebase/firestore').Firestore,
  userId: string,
): Promise<string[]> {
  const now = Date.now();
  const ids = new Set<string>();

  function collect(data: Record<string, unknown>) {
    const expiresAt = new Date(String(data.expires_at)).getTime();
    if (
      !Number.isNaN(expiresAt) &&
      expiresAt > now &&
      typeof data.package_id === 'string'
    ) {
      ids.add(data.package_id);
    }
  }

  try {
    const snap = await getDocs(
      query(collection(db, 'entitlements'), where('user_id', '==', userId)),
    );
    snap.forEach((d) => collect(d.data()));
  } catch (err) {
    console.warn('Entitlements query failed:', err);
  }

  for (const packageId of ['medical-biology', 'genetics']) {
    try {
      const snap = await getDoc(doc(db, 'entitlements', `${userId}_${packageId}`));
      if (snap.exists()) collect(snap.data());
    } catch {
      /* doc may be unreadable before rules sync */
    }
  }

  return [...ids];
}

export async function fetchEntitlementsViaApi(
  siteUrl: string,
  idToken: string,
): Promise<string[]> {
  const base = siteUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/api/my-entitlements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    package_ids?: string[];
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? `Entitlements API HTTP ${res.status}`);
  }

  return data.package_ids ?? [];
}

export function isPackageEntitled(
  entitledPackageIds: string[],
  packageId: string,
): boolean {
  return entitledPackageIds.includes(packageId);
}

export async function hasEntitlement(
  db: import('firebase/firestore').Firestore,
  userId: string,
  packageId: string,
): Promise<boolean> {
  const ref = doc(db, 'entitlements', `${userId}_${packageId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data();
  const expiresAt = new Date(String(data.expires_at)).getTime();
  const now = Date.now();
  return !Number.isNaN(expiresAt) && expiresAt > now;
}

export function firebaseMapToCellLevels(
  firebaseMap: Record<
    string,
    { watch_count?: number; manual_level?: number; status?: string; resource?: string }
  >,
  firebaseItemKey: string,
): Record<ResourceType, ProgressLevel> {
  return {
    V: progressLevel('V', firebaseMap[progressMapKey(firebaseItemKey, 'V')] ?? {}),
    P: progressLevel('P', firebaseMap[progressMapKey(firebaseItemKey, 'P')] ?? {}),
    I: progressLevel('I', firebaseMap[progressMapKey(firebaseItemKey, 'I')] ?? {}),
    Q: progressLevel('Q', firebaseMap[progressMapKey(firebaseItemKey, 'Q')] ?? {}),
  };
}
