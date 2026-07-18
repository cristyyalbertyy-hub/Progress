export type ResourceType = 'V' | 'P' | 'I' | 'Q';

export const RESOURCE_TYPES: ResourceType[] = ['V', 'P', 'I', 'Q'];

export const AUTO_RESOURCES: ResourceType[] = ['V', 'P'];
export const MANUAL_RESOURCES: ResourceType[] = ['I', 'Q'];

/** Firebase package_ids with live progress sync (apps + dashboard). */
export const SYNCED_PACKAGE_IDS = [
  'human-anatomy-1',
  'medical-biology',
  'genetics',
  'physics',
  'information-processing',
  'statistics',
  'histology',
  'embryology',
  'histology-embryology',
  'chemistry',
  'introductory-biochemistry',
  'chemistry-introductory-biochemistry',
  'history-of-medicine',
  'moral-philosophy',
  'health-technology-assessments',
  'italian-health-system',
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

const PHYSICS_ITEM_KEYS: Record<string, string> = {
  'm-mu': 'M/MU',
  'm-k': 'M/K',
  'm-nl': 'M/NL',
  'm-we': 'M/WE',
  'm-rm': 'M/RM',
  'em-cf': 'EM/ECF',
  'em-ep': 'EM/EP',
  'em-cc': 'EM/ECDC',
  'em-mg': 'EM/M',
  'em-ei': 'EM/EI',
  'vw-ws': 'VW/WMS',
  'vw-ew': 'VW/EW',
  'vw-lo': 'VW/LO',
  'vw-xr': 'VW/XRC',
  't-tk': 'T/TK',
  't-hc': 'T/HC',
  't-tl': 'T/TL',
  'n-r': 'N/R',
  'n-nf': 'N/NF',
  'n-mn': 'N/MN',
  'f-core': 'F/FL',
};

const INFORMATION_PROCESSING_ITEM_KEYS: Record<string, string> = {
  his: 'HIS',
  emr: 'EMR',
  ps: 'PS',
  ds: 'DS',
  dm: 'DM',
};

const HISTORY_OF_MEDICINE_ITEM_KEYS: Record<string, string> = {
  'af-mag': 'AF_MAG',
  'af-hrm': 'AF_HRM',
  'af-thm': 'AF_THM',
  'af-ari': 'AF_ARI',
  'sa-sre': 'SA_SRE',
  'sa-ves': 'SA_VES',
  'sa-har': 'SA_HAR',
  'sa-fle': 'SA_FLE',
  'ph-jen': 'PH_JEN',
  'ph-sem': 'PH_SEM',
  'ph-mge': 'PH_MGE',
};

const MORAL_PHILOSOPHY_ITEM_KEYS: Record<string, string> = {
  'tf-ms': 'TF/MS',
  'tf-pa': 'TF/PA',
  'tf-ser': 'TF/SER',
  'ce-ppr': 'CE/PPR',
  'ce-nm': 'CE/NM',
  'ce-e': 'CE/E',
  'ce-ec': 'CE/EC',
  'gc-sdg': 'GC/SDG',
  'gc-hd': 'GC/HD',
  'gc-hrh': 'GC/HRH',
  'gc-tm': 'GC/TM',
};

const HTA_ITEM_KEYS: Record<string, string> = {
  'hta-er': 'ER',
  'hta-cca': 'CCA',
  'hta-htas': 'HTAS',
};

const ITALIAN_HEALTH_SYSTEM_ITEM_KEYS: Record<string, string> = {
  'ihs-os': 'OS',
  'ihs-ss': 'SS',
  'ihs-bc': 'BC',
};

const PACKAGE_ITEM_KEY_MAPS: Record<string, Record<string, string>> = {
  genetics: GENETICS_ITEM_KEYS,
  physics: PHYSICS_ITEM_KEYS,
  'information-processing': INFORMATION_PROCESSING_ITEM_KEYS,
  'history-of-medicine': HISTORY_OF_MEDICINE_ITEM_KEYS,
  'moral-philosophy': MORAL_PHILOSOPHY_ITEM_KEYS,
  'health-technology-assessments': HTA_ITEM_KEYS,
  'italian-health-system': ITALIAN_HEALTH_SYSTEM_ITEM_KEYS,
};

export function toFirebaseItemKey(packageId: string, itemId: string): string {
  const map = PACKAGE_ITEM_KEY_MAPS[packageId];
  if (map) return map[itemId] ?? itemId;
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
