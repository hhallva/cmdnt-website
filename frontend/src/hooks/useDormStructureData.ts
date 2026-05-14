import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dormitoryApi } from '../api/dormitory';
import { apiClient } from '../api/client';
import type { RoomDto } from '../types/rooms';
import type { StudentsDto } from '../types/students';

type RefetchOptions = {
    silent?: boolean;
};

export const structureQueryKeys = {
    dataset: (buildingId?: number) => ['structure', 'dataset', buildingId ?? 'all'] as const,
};

export const useDormStructureData = (buildingId?: number) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: structureQueryKeys.dataset(buildingId),
        queryFn: async () => {
            if (buildingId) {
                const [rooms, students] = await Promise.all([
                    apiClient.getRoomsByBuildingId(buildingId),
                    apiClient.getAllStudents(),
                ]);

                return { rooms, students };
            }

            const dataset = await dormitoryApi.fetchDataset();
            return {
                rooms: dataset.rooms,
                students: dataset.students,
            };
        },
    });

    const refetchStructureData = useCallback(async (_options?: RefetchOptions) => {
        await refetch();
    }, [refetch]);

    return {
        rooms: data?.rooms ?? ([] as RoomDto[]),
        students: data?.students ?? ([] as StudentsDto[]),
        loading: isLoading,
        error: error instanceof Error ? error.message : null,
        refetch: refetchStructureData,
    };
};
