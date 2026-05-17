import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '../api/client';

export type UsersFilters = {
    search?: string;
    roleId?: number;
};

export const usersQueryKeys = {
    all: ['users'] as const,
    statistics: () => ['users', 'statistics'] as const,
    roles: () => ['users', 'roles'] as const,
    lists: () => ['users', 'list'] as const,
    list: (page: number, filters: UsersFilters) => ['users', 'list', page, filters] as const,
};

export const useUserStatisticsQuery = () => useQuery({
    queryKey: usersQueryKeys.statistics(),
    queryFn: () => apiClient.getUserStatistics(),
});

export const useRolesQuery = () => useQuery({
    queryKey: usersQueryKeys.roles(),
    queryFn: () => apiClient.getAllRoles(),
});

export const useUsersQuery = (filters: UsersFilters, page: number) => useQuery({
    queryKey: usersQueryKeys.list(page, filters),
    queryFn: () => apiClient.getUsersPage({ page, ...filters }),
    placeholderData: keepPreviousData,
});