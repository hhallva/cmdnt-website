export interface RoomDto {
    id: number;
    floor: number;
    number: string;
    capacity: number;
    currentCapacity: number;
    genderType: boolean | null;
}

export interface PostRoomDto {
    buildingId: number;
    floor: number;
    number: number;
    capacity: number;
}