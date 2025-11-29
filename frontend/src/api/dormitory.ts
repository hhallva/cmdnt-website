import { apiClient } from './client';
import type { RoomDto } from '../types/rooms';
import type { StudentsDto } from '../types/students';

export interface DormitoryDataset {
    rooms: RoomDto[];
    students: StudentsDto[];
}

export interface BlockDetails {
    room: RoomDto;
    students: StudentsDto[];
}

export const dormitoryApi = {
    async fetchDataset(): Promise<DormitoryDataset> {
        const [rooms, students] = await Promise.all([
            apiClient.getAllRooms(),
            apiClient.getAllStudents(),
        ]);

        return { rooms, students };
    },

    async fetchBlockDetails(roomId: number): Promise<BlockDetails> {
        const [room, students] = await Promise.all([
            apiClient.getRoomById(roomId),
            apiClient.getStudentsByRoomId(roomId),
        ]);

        return { room, students };
    },
};
