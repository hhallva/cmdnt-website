import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const groupQueryKeys = {
    all: ['groups'] as const,
};

export const useGroupsQuery = () => {
    return useQuery({
        queryKey: groupQueryKeys.all,
        queryFn: () => apiClient.getAllGroups(),
    });
};