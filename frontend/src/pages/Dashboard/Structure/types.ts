import type { RoomDto } from '../../../types/rooms';
import type { StudentsDto } from '../../../types/students';

export type RoomWithOccupants = RoomDto & { occupants: StudentsDto[] };
export type RoomStatus = 'occupied' | 'free' | 'partial';

export type BlockWithRooms = {
    blockNumber: string;
    floorNumber: number;
    rooms: RoomWithOccupants[];
    capacity: number;
    currentCapacity: number;
    genderType: RoomWithOccupants['genderType'];
};

export type FloorWithBlocks = {
    floor: number;
    blocks: BlockWithRooms[];
    total: number;
    free: number;
};

export type SettlementFormState = {
    studentId: string;
    floorNumber: string;
    roomId: string;
};

export type SettlementFormErrors = Partial<Record<'studentId' | 'roomId', string>>;
