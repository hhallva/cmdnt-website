import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '../api/client';

export type StudentsFilters = {
    search?: string;
    buildingId?: number;
    unassigned?: boolean;
    groupId?: number;
    course?: number;
    gender?: boolean;
};

export const studentsQueryKeys = {
    all: ['students'] as const,
    lists: () => ['students', 'list'] as const,
    list: (page: number, filters: StudentsFilters) => ['students', 'list', page, filters] as const,
    groups: () => ['students', 'groups'] as const,
    buildings: () => ['students', 'buildings'] as const,
};

export const useStudentsQuery = (filters: StudentsFilters, page: number) => useQuery({
    queryKey: studentsQueryKeys.list(page, filters),
    queryFn: () => apiClient.getStudentsPage({ page, ...filters }),
    placeholderData: keepPreviousData,
});

export const useStudentGroupsQuery = () => useQuery({
    queryKey: studentsQueryKeys.groups(),
    queryFn: () => apiClient.getAllGroups(),
});

export const useStudentBuildingsQuery = () => useQuery({
    queryKey: studentsQueryKeys.buildings(),
    queryFn: () => apiClient.getAllBuildings(),
});