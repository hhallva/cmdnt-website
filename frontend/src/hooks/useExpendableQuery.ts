import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '../api/client';

export type ExpendableDistributionsFilters = {
    search?: string;
    studentIds?: number[];
};

export const expendableQueryKeys = {
    all: ['expendable'] as const,
    equipment: () => ['expendable', 'equipment'] as const,
    distributions: () => ['expendable', 'distributions'] as const,
    distributionsLists: () => ['expendable', 'distributions', 'list'] as const,
    distributionsList: (page: number, filters: ExpendableDistributionsFilters) => ['expendable', 'distributions', 'list', page, filters] as const,
    distributionsAll: (filters: ExpendableDistributionsFilters = {}) => ['expendable', 'distributions', 'all', filters] as const,
};

export const useExpendableEquipmentQuery = () => useQuery({
    queryKey: expendableQueryKeys.equipment(),
    queryFn: () => apiClient.getExpendableEquipment(),
});

export const useExpendableDistributionsPageQuery = (filters: ExpendableDistributionsFilters, page: number) => useQuery({
    queryKey: expendableQueryKeys.distributionsList(page, filters),
    queryFn: () => apiClient.getExpendableDistributionsPage({ page, ...filters }),
    placeholderData: keepPreviousData,
});

export const useExpendableDistributionsQuery = (filters: ExpendableDistributionsFilters = {}) => useQuery({
    queryKey: expendableQueryKeys.distributionsAll(filters),
    queryFn: () => apiClient.getExpendableDistributions(filters),
});