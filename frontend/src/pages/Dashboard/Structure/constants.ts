export const STRUCTURE_TABS_STORAGE_KEY = 'structure-active-tab';
export const STRUCTURE_TAB_IDS = ['structure', 'settlement'] as const;
export const STRUCTURE_SETTLEMENT_PREFILL_KEY = 'structure-settlement-prefill';
export const SETTLEMENT_TAB_ID = 'settlement';

export type StructureTabId = (typeof STRUCTURE_TAB_IDS)[number];
