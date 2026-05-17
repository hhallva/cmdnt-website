import { BaseApiService } from '../core/baseApiService';
import type { StationaryTypeDto, PostStationaryTypeDto } from '../../types/stationaryTypes';
import type { StatusDto } from '../../types/statuses';
import type {
    StationaryEquipmentDto,
    PostStationaryEquipmentDto,
    UpdateStationaryEquipmentDto,
} from '../../types/stationaryEquipment';
import type { StationaryEquipmentStatisticDto } from '../../types/stationaryEquipmentStatistic';

export class StationaryService extends BaseApiService {
    getStationaryTypes(): Promise<StationaryTypeDto[]> {
        return this.get<StationaryTypeDto[]>('/api/v1/Stationary');
    }

    getStationaryTypeById(id: number): Promise<StationaryTypeDto> {
        return this.get<StationaryTypeDto>(`/api/v1/Stationary/${id}`);
    }

    createStationaryType(payload: PostStationaryTypeDto): Promise<StationaryTypeDto> {
        return this.post<StationaryTypeDto, PostStationaryTypeDto>('/api/v1/Stationary', payload);
    }

    updateStationaryType(id: number, payload: StationaryTypeDto): Promise<StationaryTypeDto> {
        return this.put<StationaryTypeDto, StationaryTypeDto>(`/api/v1/Stationary/${id}`, payload);
    }

    deleteStationaryType(id: number): Promise<void> {
        return this.delete(`/api/v1/Stationary/${id}`);
    }

    getStatuses(): Promise<StatusDto[]> {
        return this.get<StatusDto[]>('/api/v1/Statuses');
    }

    getStationaryEquipment(): Promise<StationaryEquipmentDto[]> {
        return this.get<StationaryEquipmentDto[]>('/api/v1/StationaryEquipment');
    }

    getStationaryEquipmentStatistics(): Promise<StationaryEquipmentStatisticDto> {
        return this.get<StationaryEquipmentStatisticDto>('/api/v1/StationaryEquipment/statistic');
    }

    getStationaryEquipmentById(id: number): Promise<StationaryEquipmentDto> {
        return this.get<StationaryEquipmentDto>(`/api/v1/StationaryEquipment/${id}`);
    }

    createStationaryEquipment(payload: PostStationaryEquipmentDto): Promise<StationaryEquipmentDto> {
        return this.post<StationaryEquipmentDto, PostStationaryEquipmentDto>('/api/v1/StationaryEquipment', payload);
    }

    updateStationaryEquipment(id: number, payload: UpdateStationaryEquipmentDto): Promise<StationaryEquipmentDto> {
        return this.put<StationaryEquipmentDto, UpdateStationaryEquipmentDto>(`/api/v1/StationaryEquipment/${id}`, payload);
    }

    assignStationaryEquipmentToRoom(equipmentId: number, roomId: number): Promise<StationaryEquipmentDto> {
        return this.post<StationaryEquipmentDto>(`/api/v1/StationaryEquipment/${equipmentId}/room/${roomId}`);
    }

    evictStationaryEquipment(equipmentId: number, roomId: number): Promise<StationaryEquipmentDto> {
        return this.delete<StationaryEquipmentDto>(`/api/v1/StationaryEquipment/${equipmentId}/room/${roomId}`);
    }

    deleteStationaryEquipment(id: number): Promise<void> {
        return this.delete(`/api/v1/StationaryEquipment/${id}`);
    }
}
