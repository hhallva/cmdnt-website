import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../api/client';

export const buildingsQueryKeys = {
    all: ['buildings'] as const,
    lists: () => ['buildings', 'list'] as const,
    list: () => ['buildings', 'list', 'all'] as const,
    detail: (buildingId: number) => ['buildings', 'detail', buildingId] as const,
    summary: (buildingId: number) => ['buildings', 'summary', buildingId] as const,
    statistics: () => ['buildings', 'statistics'] as const,
    structureStatistics: (buildingId: number) => ['buildings', 'structure-statistics', buildingId] as const,
};

export const useBuildingsQuery = () => useQuery({
    queryKey: buildingsQueryKeys.list(),
    queryFn: () => apiClient.getAllBuildings(),
});

export const useBuildingByIdQuery = (buildingId?: number) => useQuery({
    queryKey: buildingsQueryKeys.detail(buildingId ?? 0),
    enabled: typeof buildingId === 'number' && Number.isFinite(buildingId) && buildingId > 0,
    queryFn: () => apiClient.getBuildingById(buildingId as number),
});

export const useBuildingSummaryQuery = (buildingId?: number, enabled = true) => useQuery({
    queryKey: buildingsQueryKeys.summary(buildingId ?? 0),
    enabled: enabled && typeof buildingId === 'number' && Number.isFinite(buildingId) && buildingId > 0,
    queryFn: () => apiClient.getBuildingSummary(buildingId as number),
});

export const useOverallStructureStatisticsQuery = () => useQuery({
    queryKey: buildingsQueryKeys.statistics(),
    queryFn: () => apiClient.getStructuresStatistics(),
});

export const useBuildingStructureStatisticsQuery = (buildingId?: number) => useQuery({
    queryKey: buildingsQueryKeys.structureStatistics(buildingId ?? 0),
    enabled: typeof buildingId === 'number' && Number.isFinite(buildingId) && buildingId > 0,
    queryFn: () => apiClient.getStructureStatistics(buildingId as number),
});