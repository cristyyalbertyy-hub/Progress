export type ProgressLevel = 0 | 1 | 2 | 3;

export interface TrackableItem {
  id: string;
}

export interface Chapter {
  id: string;
  items: TrackableItem[];
}

export interface SubDiscipline {
  id: string;
  number: number;
  available: boolean;
  packageUrl?: string;
  /** Firebase package id when progress syncs from package apps */
  packageId?: string;
  chapters: Chapter[];
}

export interface DisciplineGroup {
  id: string;
  subDisciplines: SubDiscipline[];
}

export const PROGRESS_COLORS: Record<ProgressLevel, string> = {
  0: '#e53935',
  1: '#fdd835',
  2: '#fb8c00',
  3: '#43a047',
};

function chapter(id: string, itemIds: string[]): Chapter {
  return {
    id,
    items: itemIds.map((itemId) => ({ id: itemId })),
  };
}

const physicsChapters: Chapter[] = [
  chapter('mechanics', ['m-mu', 'm-k', 'm-nl', 'm-we', 'm-rm']),
  chapter('electricity-magnetism', ['em-cf', 'em-ep', 'em-cc', 'em-mg', 'em-ei']),
  chapter('vibrations-waves', ['vw-ws', 'vw-ew', 'vw-lo', 'vw-xr']),
  chapter('thermodynamics', ['t-tk', 't-hc', 't-tl']),
  chapter('nuclear-physics', ['n-r', 'n-nf', 'n-mn']),
  chapter('fluids', ['f-core']),
];

const statisticsChapters: Chapter[] = [
  chapter('basics-and-data', [
    'populations-and-samples',
    'variable-types',
    'data-display',
  ]),
  chapter('numerical-outcome-analysis', [
    'mean-sd-standard-error',
    'normal-distribution',
    'confidence-intervals-means',
    'hypothesis-testing-p-values',
    'comparison-two-means-t-tests',
    'analysis-of-variance-anova',
    'linear-and-multiple-regression',
    'correlation-coefficients',
  ]),
  chapter('binary-outcome-analysis', [
    'differences-risks-and-odds',
    'binomial-distribution',
    'comparing-proportions',
    'chi-squared-tests',
    'confounding-and-stratification',
    'logistic-regression',
    'matching-studies',
  ]),
  chapter('longitudinal-and-survival-analysis', [
    'odds-and-hazard-ratios',
    'computing-risks',
    'survival-analysis-kaplan-meier',
    'regression-analysis-cox-hazards',
    'standardization',
  ]),
  chapter('statistical-modelling', [
    'likelihood-theory',
    'non-parametric-methods-ranking',
    'bayesian-methods',
    'systematic-reviews-meta-analysis',
    'diagnostic-test-analysis',
    'bootstrapping-and-jackknifing',
  ]),
  chapter('study-design-and-interpretation', [
    'sample-size-and-power-calculation',
    'measurement-error-reproducibility',
    'measures-of-association-impact',
    'analysis-of-bias',
    'causal-inference-studies',
  ]),
];

const informationProcessingChapters: Chapter[] = [
  chapter('informatics-topics', ['his', 'emr', 'ps', 'ds', 'dm']),
];

const medicalBiologyChapters: Chapter[] = [
  chapter('cell-fundamentals', [
    'cell-theory',
    'macromolecules',
    'prokaryotic-vs-eukaryotic',
    'viruses',
  ]),
  chapter('cell-structure-function', [
    'plasma-membrane',
    'organelles',
    'cytoskeleton',
    'mitochondria',
  ]),
  chapter('molecular-biology', [
    'dna-structure-duplication',
    'rna-transcription',
    'protein-synthesis',
    'gene-expression-control',
  ]),
  chapter('cellular-processes', [
    'cell-trafficking',
    'mitosis-meiosis',
    'cell-death',
    'cell-signaling',
  ]),
  chapter('cancer-biology', [
    'tumour-transformation',
    'proto-oncogenes',
    'tumour-suppressors',
  ]),
];

const geneticsChapters: Chapter[] = [
  chapter('basic-genetics', ['bg-t', 'bg-mp', 'bg-pg']),
  chapter('inheritance-models', ['im-m', 'im-c', 'im-mu', 'im-mi']),
  chapter('clinical-application', ['ca-pa', 'ca-rc', 'ca-gd']),
];

const humanAnatomyChapters: Chapter[] = [
  chapter('ls-at', ['ls-at-sec', 'ls-at-loc', 'ls-at-mt']),
  chapter('ls-os', ['ls-os-sk', 'ls-os-as', 'ls-os-aps']),
  chapter('ls-ar', ['ls-ar-jd', 'ls-ar-vc', 'ls-ar-thx', 'ls-ar-lim']),
  chapter('ls-my', ['ls-my-ntm', 'ls-my-cam', 'ls-my-lm']),
  chapter('cls', ['cls-ph', 'cls-cabv', 'cls-hnv']),
  chapter('rs-oc', ['rs-oc-tt', 'rs-oc-sg', 'rs-oc-fm']),
  chapter('respiratory-structures', ['rs-ncs', 'rs-pl', 'rs-tl', 'rs-pm']),
];

const histologyEmbryologyChapters: Chapter[] = [
  chapter('cy-topics', ['cy-eco', 'cy-om', 'cy-nc', 'cy-cd']),
  chapter('hi-topics', [
    'hi-eg',
    'hi-ct',
    'hi-cb',
    'hi-bh',
    'hi-il',
    'hi-mt',
    'hi-nt',
  ]),
  chapter('em-gam', ['em-sp', 'em-og', 'em-hc']),
  chapter('em-ed', ['em-fe', 'em-w14', 'em-pl', 'em-ef']),
  chapter('em-sr', ['em-sr']),
  chapter('em-pm', ['em-pm']),
  chapter('or-topics', ['or-in', 'or-hn', 'or-gr', 'or-ug', 'or-sm', 'or-nc']),
];

const chemistryBiochemistryChapters: Chapter[] = [
  chapter('atomic-structure', ['as-api', 'as-qmm', 'as-qno', 'as-cb']),
  chapter('matter-thermodynamics', ['mt-gigl', 'mt-lvp', 'mt-sc', 'mt-eefe']),
  chapter('solutions-equilibrium', ['se-cd', 'se-kel', 'se-ec', 'se-lcf']),
  chapter('electrolytes-kinetics', ['ek-abt', 'ek-pb', 'ek-cp', 'ek-ae', 'ek-rr']),
  chapter('hydrocarbons', ['h-ch', 'h-ac', 'h-aa', 'h-acb']),
  chapter('functional-groups', ['fg-apt', 'fg-ak', 'fg-cae', 'fg-amines']),
  chapter('stereochemistry', ['oc-sc']),
  chapter('introductory-biochemistry', ['ib-cm', 'ib-ap', 'ib-lsp', 'ib-nbn']),
];

const historyOfMedicineChapters: Chapter[] = [
  chapter('ancient', ['af-mag', 'af-hrm', 'af-thm', 'af-ari']),
  chapter('scientific', ['sa-sre', 'sa-ves', 'sa-har', 'sa-fle']),
  chapter('public-health', ['ph-jen', 'ph-sem', 'ph-mge', 'ph-sno']),
];

const moralPhilosophyChapters: Chapter[] = [
  chapter('theoretical-foundations', ['tf-ms', 'tf-pa', 'tf-ser']),
  chapter('clinical-ethics', ['ce-ppr', 'ce-nm', 'ce-e', 'ce-ec']),
  chapter('global-context', ['gc-sdg', 'gc-hd', 'gc-hrh', 'gc-tm']),
];

const healthTechnologyAssessmentChapters: Chapter[] = [
  chapter('european-regulations', ['hta-er']),
  chapter('cost-consequences-approach', ['hta-cca']),
  chapter('hta-structure', ['hta-htas']),
];

const italianHealthSystemChapters: Chapter[] = [
  chapter('organization-structure', ['ihs-os']),
  chapter('supply-structure', ['ihs-ss']),
  chapter('budgeting-costs', ['ihs-bc']),
];

/** One purchasable package = one sidebar row (no curriculum umbrella titles). */
function packageGroup(sub: SubDiscipline): DisciplineGroup {
  return { id: sub.id, subDisciplines: [sub] };
}

export const disciplineGroups: DisciplineGroup[] = [
  packageGroup({
    id: 'human-anatomy',
    number: 1,
    available: true,
    packageId: 'human-anatomy-1',
    packageUrl: 'https://human-anatomy1.vercel.app/',
    chapters: humanAnatomyChapters,
  }),
  packageGroup({
    id: 'medical-biology',
    number: 2,
    available: true,
    packageUrl: 'https://biology-genetics.vercel.app/#/app',
    packageId: 'medical-biology',
    chapters: medicalBiologyChapters,
  }),
  packageGroup({
    id: 'genetics',
    number: 3,
    available: true,
    packageUrl: 'https://medica-genetics.vercel.app/',
    packageId: 'genetics',
    chapters: geneticsChapters,
  }),
  packageGroup({
    id: 'physics',
    number: 4,
    available: true,
    packageId: 'physics',
    packageUrl: 'https://physics-tau-five.vercel.app/',
    chapters: physicsChapters,
  }),
  packageGroup({
    id: 'information-processing',
    number: 5,
    available: true,
    packageId: 'information-processing',
    packageUrl: 'https://informatics-theta.vercel.app/',
    chapters: informationProcessingChapters,
  }),
  packageGroup({
    id: 'statistics',
    number: 6,
    available: true,
    packageId: 'statistics',
    packageUrl: 'https://statistics-nu-eight.vercel.app/',
    chapters: statisticsChapters,
  }),
  packageGroup({
    id: 'histology-embryology',
    number: 7,
    available: true,
    packageId: 'histology-embryology',
    packageUrl: 'https://histology-embryology.vercel.app/',
    chapters: histologyEmbryologyChapters,
  }),
  packageGroup({
    id: 'chemistry-biochemistry',
    number: 8,
    available: true,
    packageId: 'chemistry-introductory-biochemistry',
    packageUrl: 'https://chemistry-roan.vercel.app/',
    chapters: chemistryBiochemistryChapters,
  }),
  packageGroup({
    id: 'history-of-medicine',
    number: 9,
    available: true,
    packageId: 'history-of-medicine',
    packageUrl: 'https://history-medicine.vercel.app/',
    chapters: historyOfMedicineChapters,
  }),
  packageGroup({
    id: 'moral-philosophy',
    number: 10,
    available: true,
    packageId: 'moral-philosophy',
    packageUrl: 'https://moral-philosophy.vercel.app/',
    chapters: moralPhilosophyChapters,
  }),
  packageGroup({
    id: 'health-technology-assessments',
    number: 11,
    available: true,
    packageId: 'health-technology-assessments',
    packageUrl: 'https://health-technology-assessments.vercel.app/',
    chapters: healthTechnologyAssessmentChapters,
  }),
  packageGroup({
    id: 'italian-health-system',
    number: 12,
    available: true,
    packageId: 'italian-health-system',
    packageUrl: 'https://italian-health-system.vercel.app/',
    chapters: italianHealthSystemChapters,
  }),
];

export function getAllSubDisciplines(): SubDiscipline[] {
  return disciplineGroups.flatMap((g) => g.subDisciplines);
}

export function findSubDiscipline(id: string): SubDiscipline | undefined {
  return getAllSubDisciplines().find((s) => s.id === id);
}

export function findGroupForSubDiscipline(subId: string): DisciplineGroup | undefined {
  return disciplineGroups.find((g) =>
    g.subDisciplines.some((s) => s.id === subId),
  );
}

export function getAllItemIds(subDiscipline: SubDiscipline): string[] {
  return subDiscipline.chapters.flatMap((c) => c.items.map((i) => i.id));
}

export function countSubDisciplineItems(subDiscipline: SubDiscipline): number {
  return getAllItemIds(subDiscipline).length;
}

export function calcProgress(
  itemIds: string[],
  progress: Record<string, ProgressLevel>,
): {
  points: number;
  maxPoints: number;
  consolidated: number;
  itemCount: number;
  percent: number;
} {
  const itemCount = itemIds.length;
  const maxPoints = itemCount * 3;
  const points = itemIds.reduce((sum, id) => sum + (progress[id] ?? 0), 0);
  const consolidated = itemIds.filter((id) => (progress[id] ?? 0) === 3).length;
  const percent = maxPoints === 0 ? 0 : Math.round((points / maxPoints) * 100);
  return { points, maxPoints, consolidated, itemCount, percent };
}
