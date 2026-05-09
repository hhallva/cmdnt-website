import { BaseApiService } from '../core/baseApiService';
import type { BuildingDto, BuildingSummaryDto, PostBuildingDto } from '../../types/buildings';
import type { StructureStatisticDto, OverallStructureStatisticDto as StructuresStatisticDto } from '../../types/structures';

export class BuildingsService extends BaseApiService {
    getAllBuildings(): Promise<BuildingDto[]> {
        return this.get<BuildingDto[]>('/api/v1/Buildings');
    }

    getBuildingById(id: number): Promise<BuildingDto> {
        return this.get<BuildingDto>(`/api/v1/Buildings/${id}`);
    }

    getBuildingSummary(id: number): Promise<BuildingSummaryDto> {
        return this.get<BuildingSummaryDto>(`/api/v1/Buildings/${id}/summary`);
    }

    createBuilding(payload: PostBuildingDto): Promise<BuildingDto> {
        return this.post<BuildingDto, PostBuildingDto>('/api/v1/Buildings', payload);
    }

    updateBuilding(id: number, payload: BuildingDto): Promise<BuildingDto> {
        return this.put<BuildingDto, BuildingDto>(`/api/v1/Buildings/${id}`, payload);
    }

    deleteBuilding(id: number): Promise<void> {
        return this.delete(`/api/v1/Buildings/${id}`);
    }

    getStructureStatistics(id: number): Promise<StructureStatisticDto> {
        return this.get<StructureStatisticDto>(`/api/v1/Buildings/${id}/statistic`);
    }

    getStructuresStatistics(): Promise<StructuresStatisticDto> {
        return this.get<StructuresStatisticDto>('/api/v1/Buildings/statistic');
    }
}
