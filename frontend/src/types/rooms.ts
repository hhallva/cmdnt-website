export interface RoomDto {
    id: number;
    floorNumber: number;
    roomNumber: string;
    capacity: number;
    currentCapacity: number;
    genderType: boolean | null;
}

export interface PostRoomDto {
    floorNumber: number;
    roomNumber: number;
    capacity: number;
}