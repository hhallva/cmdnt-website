export interface RoomDto {
    id: number;
    floorNumber: number;
    roomNumber: string;
    capacity: number;
    currentCapacity: number;
    genderType: boolean | null;
}