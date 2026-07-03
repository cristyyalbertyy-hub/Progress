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
