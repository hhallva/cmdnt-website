import { BaseApiService } from '../core/baseApiService';
import type { ExpendableTypeDto, PostExpendableTypeDto } from '../../types/expendableTypes';
import type { ExpendableEquipmentDto, ExpendableEquipmentAdjustmentDto } from '../../types/expendableEquipment';
import type { ExpendableDistributionDto } from '../../types/expendableDistribution';

export class ExpendableService extends BaseApiService {
    getExpendableEquipment(): Promise<ExpendableEquipmentDto[]> {
        return this.get<ExpendableEquipmentDto[]>('/api/v1/Expendable');
    }

    addExpendableEquipment(id: number, payload: ExpendableEquipmentAdjustmentDto): Promise<ExpendableEquipmentDto> {
        return this.post<ExpendableEquipmentDto, ExpendableEquipmentAdjustmentDto>(`/api/v1/Expendable/${id}`, payload);
    }

    subtractExpendableEquipment(id: number, payload: ExpendableEquipmentAdjustmentDto): Promise<ExpendableEquipmentDto> {
        return this.delete<ExpendableEquipmentDto, ExpendableEquipmentAdjustmentDto>(`/api/v1/Expendable/${id}`, payload);
    }

    getExpendableDistributions(): Promise<ExpendableDistributionDto[]> {
        return this.get<ExpendableDistributionDto[]>('/api/v1/Expendable/distribution');
    }

    getExpendableTypes(): Promise<ExpendableTypeDto[]> {
        return this.get<ExpendableTypeDto[]>('/api/v1/Expendable');
    }

    getExpendableTypeById(id: number): Promise<ExpendableTypeDto> {
        return this.get<ExpendableTypeDto>(`/api/v1/Expendable/${id}`);
    }

    createExpendableType(payload: PostExpendableTypeDto): Promise<ExpendableTypeDto> {
        return this.post<ExpendableTypeDto, PostExpendableTypeDto>('/api/v1/Expendable', payload);
    }

    updateExpendableType(id: number, payload: ExpendableTypeDto): Promise<ExpendableTypeDto> {
        return this.put<ExpendableTypeDto, ExpendableTypeDto>(`/api/v1/Expendable/${id}`, payload);
    }

    deleteExpendableType(id: number): Promise<void> {
        return this.delete(`/api/v1/Expendable/${id}`);
    }
}
