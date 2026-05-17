// src/hooks/useRoomData.ts
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { StudentsDto } from '../types/students';

const roomQueryKeys = {
    detail: (roomId: number | null) => ['room', roomId] as const,
};

export const useRoomData = (roomId: number | null, enabled: boolean) => {
    const isEnabled = enabled && roomId !== null;
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: roomQueryKeys.detail(roomId),
        enabled: isEnabled,
        queryFn: async () => {
            const [room, neighbours] = await Promise.all([
                apiClient.getRoomById(roomId as number),
                apiClient.getStudentsByRoomId(roomId as number),
            ]);

            return { room, neighbours };
        },
    });

    const refetchRoomData = useCallback(() => {
        void refetch();
    }, [refetch]);

    return {
        room: data?.room ?? null,
        neighbours: data?.neighbours ?? ([] as StudentsDto[]),
        loading: isLoading,
        error: error instanceof Error ? error.message : null,
        refetch: refetchRoomData,
    };
};