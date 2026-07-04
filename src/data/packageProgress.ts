export type ResourceType = 'V' | 'P' | 'I' | 'Q';

export const RESOURCE_TYPES: ResourceType[] = ['V', 'P', 'I', 'Q'];

export const AUTO_RESOURCES: ResourceType[] = ['V', 'P'];
export const MANUAL_RESOURCES: ResourceType[] = ['I', 'Q'];

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
  return packageId === 'genetics' || packageId === 'medical-biology';
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

export function isSubVisibleToStudent(
  sub: { id: string; packageId?: string; available: boolean },
  signedIn: boolean,
  entitledPackageIds: string[],
): boolean {
  if (!sub.available) return false;
  if (!signedIn) return false;
  return entitledPackageIds.includes(packageIdForSub(sub));
}
