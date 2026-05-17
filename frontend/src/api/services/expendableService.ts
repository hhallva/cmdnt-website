import { BaseApiService } from '../core/baseApiService';
import type { ExpendableTypeDto, PostExpendableTypeDto } from '../../types/expendableTypes';
import type { ExpendableEquipmentDto, ExpendableEquipmentAdjustmentDto } from '../../types/expendableEquipment';
import type { ExpendableDistributionDto } from '../../types/expendableDistribution';
import type { PaginatedResponse } from '../../types/pagination';

type GetExpendableDistributionsPageParams = {
    page: number;
    pageSize?: number;
    search?: string;
    studentIds?: number[];
};

type GetAllExpendableDistributionsParams = Omit<GetExpendableDistributionsPageParams, 'page' | 'pageSize'>;

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

    getExpendableDistributions({ search, studentIds }: GetAllExpendableDistributionsParams = {}): Promise<ExpendableDistributionDto[]> {
        const params = new URLSearchParams({
            all: 'true',
        });

        if (search?.trim()) params.set('search', search.trim());
        if (studentIds?.length) params.set('studentIds', studentIds.join(','));

        return this.get<ExpendableDistributionDto[]>(`/api/v1/Expendable/distribution?${params.toString()}`);
    }

    getExpendableDistributionsPage({
        page,
        pageSize = 50,
        search,
        studentIds,
    }: GetExpendableDistributionsPageParams): Promise<PaginatedResponse<ExpendableDistributionDto>> {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });

        if (search?.trim()) params.set('search', search.trim());
        if (studentIds?.length) params.set('studentIds', studentIds.join(','));

        return this.get<PaginatedResponse<ExpendableDistributionDto>>(`/api/v1/Expendable/distribution?${params.toString()}`);
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
