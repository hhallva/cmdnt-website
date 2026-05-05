import { dormitoryApi } from '../api/dormitory';
import { apiClient } from '../api/client';
import type { RoomDto } from '../types/rooms';
import type { StudentsDto } from '../types/students';
import { useAsyncResource } from './shared/useAsyncResource';

export const useDormStructureData = (buildingId?: number) => {
    const initialData: { rooms: RoomDto[]; students: StudentsDto[] } = {
        rooms: [],
        students: [],
    };

    const { data, loading, error, refetch } = useAsyncResource({
        enabled: true,
        initialData,
        loader: async () => {
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
        deps: [buildingId],
    });

    return {
        rooms: data.rooms,
        students: data.students,
        loading,
        error,
        refetch,
    };
};
