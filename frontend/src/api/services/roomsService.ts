import { BaseApiService } from '../core/baseApiService';
import type { RoomDto, PostRoomDto } from '../../types/rooms';
import type { StudentsDto } from '../../types/students';

export class RoomsService extends BaseApiService {
    getAllRooms(): Promise<RoomDto[]> {
        return this.get<RoomDto[]>('/api/v1/Rooms');
    }

    getRoomsByBuildingId(buildingId: number): Promise<RoomDto[]> {
        return this.get<RoomDto[]>(`/api/v1/Buildings/${buildingId}/Rooms`);
    }

    getRoomById(id: number): Promise<RoomDto> {
        return this.get<RoomDto>(`/api/v1/Rooms/${id}`);
    }

    getStudentsByRoomId(id: number): Promise<StudentsDto[]> {
        return this.get<StudentsDto[]>(`/api/v1/Rooms/${id}/students`);
    }

    createRoom(payload: PostRoomDto): Promise<RoomDto> {
        return this.post<RoomDto, PostRoomDto>('/api/v1/Rooms', payload);
    }

    deleteRoom(id: number): Promise<void> {
        return this.delete(`/api/v1/Rooms/${id}`);
    }
}
