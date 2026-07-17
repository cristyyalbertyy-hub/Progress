export type ResourceType = 'V' | 'P' | 'I' | 'Q';

export const RESOURCE_TYPES: ResourceType[] = ['V', 'P', 'I', 'Q'];

export const AUTO_RESOURCES: ResourceType[] = ['V', 'P'];
export const MANUAL_RESOURCES: ResourceType[] = ['I', 'Q'];

/** Firebase package_ids with live progress sync (apps + dashboard). */
export const SYNCED_PACKAGE_IDS = [
  'medical-biology',
  'genetics',
  'histology',
  'embryology',
  'histology-embryology',
  'chemistry',
  'introductory-biochemistry',
  'chemistry-introductory-biochemistry',
] as const;

/** Partial SKU → parent bundle (hide partial row when bundle is owned). */
const PARTIAL_TO_BUNDLE: Record<string, string> = {
  histology: 'histology-embryology',
  embryology: 'histology-embryology',
  chemistry: 'chemistry-introductory-biochemistry',
  'introductory-biochemistry': 'chemistry-introductory-biochemistry',
};

/** Dashboard item id → Firebase item_key */
const GENETICS_ITEM_KEYS: Record<string, string> = {
  'bg-t': 'BG/T',
  'bg-mp': 'BG/MP',
  'bg-pg': 'BG/PG',
  'im-m': 'IM/M',
  'im-c': 'IM/C',
  'im-mu': 'IM/Mu',
  'im-mi': 'IM/Mi',
  'ca-pa': 'CA/PA',
  'ca-rc': 'CA/RC',
  'ca-gd': 'CA/GD',
};

export function toFirebaseItemKey(packageId: string, itemId: string): string {
  if (packageId === 'genetics') {
    return GENETICS_ITEM_KEYS[itemId] ?? itemId;
  }
  return itemId;
}

export function progressCellKey(itemId: string, resource: ResourceType): string {
  return `${itemId}/${resource}`;
}

export function isSyncedPackage(packageId?: string): packageId is string {
  return (
    typeof packageId === 'string' &&
    (SYNCED_PACKAGE_IDS as readonly string[]).includes(packageId)
  );
}

/** Progress sub-discipline id → Firebase / catalog package_id */
const SUB_ID_TO_PACKAGE_ID: Record<string, string> = {
  'human-anatomy': 'human-anatomy-1',
  'chemistry-biochemistry': 'chemistry-introductory-biochemistry',
};

export function packageIdForSub(sub: { id: string; packageId?: string }): string {
  if (sub.packageId) return sub.packageId;
  return SUB_ID_TO_PACKAGE_ID[sub.id] ?? sub.id;
}

export function isPackageEntitledForSub(
  entitledPackageIds: string[],
  sub: { id: string; packageId?: string },
): boolean {
  const pkgId = packageIdForSub(sub);
  if (!entitledPackageIds.includes(pkgId)) return false;

  const parentBundle = PARTIAL_TO_BUNDLE[pkgId];
  if (parentBundle && entitledPackageIds.includes(parentBundle)) {
    return false;
  }

  return true;
}

export function isSubVisibleToStudent(
  sub: { id: string; packageId?: string; available: boolean },
  signedIn: boolean,
  entitledPackageIds: string[],
): boolean {
  if (!sub.available) return false;
  if (!signedIn) return false;
  return isPackageEntitledForSub(entitledPackageIds, sub);
}
