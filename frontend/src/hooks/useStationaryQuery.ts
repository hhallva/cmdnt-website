import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '../api/client';

export type StationaryEquipmentFilters = {
    search?: string;
    building?: number | 'storage';
    typeId?: number;
    statusId?: number;
};

export const stationaryQueryKeys = {
    all: ['stationary'] as const,
    statistics: () => ['stationary', 'statistics'] as const,
    types: () => ['stationary', 'types'] as const,
    statuses: () => ['stationary', 'statuses'] as const,
    equipment: () => ['stationary', 'equipment'] as const,
    equipmentLists: () => ['stationary', 'equipment', 'list'] as const,
    equipmentList: (page: number, filters: StationaryEquipmentFilters) => ['stationary', 'equipment', 'list', page, filters] as const,
    equipmentAll: (filters: StationaryEquipmentFilters = {}) => ['stationary', 'equipment', 'all', filters] as const,
};

export const useStationaryEquipmentStatisticsQuery = () => useQuery({
    queryKey: stationaryQueryKeys.statistics(),
    queryFn: () => apiClient.getStationaryEquipmentStatistics(),
});

export const useStationaryTypesQuery = () => useQuery({
    queryKey: stationaryQueryKeys.types(),
    queryFn: () => apiClient.getStationaryTypes(),
});

export const useStatusesQuery = () => useQuery({
    queryKey: stationaryQueryKeys.statuses(),
    queryFn: () => apiClient.getStatuses(),
});

export const useStationaryEquipmentPageQuery = (filters: StationaryEquipmentFilters, page: number) => useQuery({
    queryKey: stationaryQueryKeys.equipmentList(page, filters),
    queryFn: () => apiClient.getStationaryEquipmentPage({ page, ...filters }),
    placeholderData: keepPreviousData,
});

export const useStationaryEquipmentQuery = (filters: StationaryEquipmentFilters = {}) => useQuery({
    queryKey: stationaryQueryKeys.equipmentAll(filters),
    queryFn: () => apiClient.getStationaryEquipment(filters),
});