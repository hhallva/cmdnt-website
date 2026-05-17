// src/hooks/useRoomData.ts
import { apiClient } from '../api/client';
import type { StudentsDto } from '../types/students';
import type { RoomDto } from '../types/rooms';
import { useAsyncResource } from './shared/useAsyncResource';

export const useRoomData = (roomId: number | null, enabled: boolean) => {
    const initialData: { room: RoomDto | null; neighbours: StudentsDto[] } = {
        room: null,
        neighbours: [],
    };

    const { data, loading, error, refetch } = useAsyncResource({
        enabled: enabled && roomId !== null,
        initialData,
        loader: async () => {
            const [room, neighbours] = await Promise.all([
                apiClient.getRoomById(roomId as number),
                apiClient.getStudentsByRoomId(roomId as number),
            ]);

            return { room, neighbours };
        },
        deps: [roomId, enabled],
    });

    return {
        room: data.room,
        neighbours: data.neighbours,
        loading,
        error,
        refetch,
    };
};