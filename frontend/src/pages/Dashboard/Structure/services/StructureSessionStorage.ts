import { STRUCTURE_SETTLEMENT_PREFILL_KEY, STRUCTURE_TABS_STORAGE_KEY } from '../constants';

type ActiveBuilding = {
    id: number;
    name: string;
    address: string;
};

type SelectValue = number | 'all';

type FurnitureSelection = {
    floor: SelectValue;
    roomId: SelectValue;
};

export class StructureSessionStorage {
    private static readonly ACTIVE_BUILDING_KEY = 'active-building';

    static saveActiveBuilding(building: ActiveBuilding): void {
        if (typeof window === 'undefined') {
            return;
        }

        sessionStorage.setItem(this.ACTIVE_BUILDING_KEY, JSON.stringify(building));
    }

    static removeActiveBuilding(): void {
        if (typeof window === 'undefined') {
            return;
        }

        sessionStorage.removeItem(this.ACTIVE_BUILDING_KEY);
    }

    static getActiveBuildingId(): number | null {
        if (typeof window === 'undefined') {
            return null;
        }

        const stored = sessionStorage.getItem(this.ACTIVE_BUILDING_KEY);
        if (!stored) {
            return null;
        }

        try {
            const parsed = JSON.parse(stored) as { id?: unknown };
            return typeof parsed.id === 'number' ? parsed.id : null;
        } catch {
            return null;
        }
    }

    static getStructureTab(availableTabIds: string[], fallbackTabId: string): string {
        if (typeof window === 'undefined') {
            return fallbackTabId;
        }

        const storedTabId = sessionStorage.getItem(STRUCTURE_TABS_STORAGE_KEY);
        if (storedTabId && availableTabIds.includes(storedTabId)) {
            return storedTabId;
        }

        return fallbackTabId;
    }

    static setStructureTab(tabId: string): void {
        if (typeof window === 'undefined' || !tabId) {
            return;
        }

        sessionStorage.setItem(STRUCTURE_TABS_STORAGE_KEY, tabId);
    }

    static consumeSettlementPrefillStudentId(): string | null {
        if (typeof window === 'undefined') {
            return null;
        }

        const payload = sessionStorage.getItem(STRUCTURE_SETTLEMENT_PREFILL_KEY);
        if (!payload) {
            return null;
        }

        sessionStorage.removeItem(STRUCTURE_SETTLEMENT_PREFILL_KEY);

        try {
            const parsed = JSON.parse(payload) as { studentId?: unknown };
            return parsed.studentId ? String(parsed.studentId) : null;
        } catch {
            return null;
        }
    }

    static getFurnitureSelection(buildingId: number | null): FurnitureSelection | null {
        if (typeof window === 'undefined' || !buildingId) {
            return null;
        }

        const raw = sessionStorage.getItem(`furniture-selection-${buildingId}`);
        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as { floor?: unknown; roomId?: unknown };
            return {
                floor: typeof parsed.floor === 'number' ? parsed.floor : 'all',
                roomId: typeof parsed.roomId === 'number' ? parsed.roomId : 'all',
            };
        } catch {
            return null;
        }
    }

    static setFurnitureSelection(buildingId: number | null, floor: SelectValue, roomId: SelectValue): void {
        if (typeof window === 'undefined' || !buildingId) {
            return;
        }

        if (floor === 'all' && roomId === 'all') {
            sessionStorage.removeItem(`furniture-selection-${buildingId}`);
            return;
        }

        sessionStorage.setItem(
            `furniture-selection-${buildingId}`,
            JSON.stringify({
                floor: floor === 'all' ? null : Number(floor),
                roomId: roomId === 'all' ? null : Number(roomId),
            })
        );
    }
}
