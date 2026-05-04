export interface StationaryEquipmentDto {
    id: number;
    inventoryNumber: string;
    typeId: number;
    typeName: string;
    statusId: number;
    statusName: string;
    roomId: number | null;
    roomNumber: string | null;
    roomCapacity: number | null;
    buildingId: number | null;
    buildingName: string | null;
    description: string | null;
}

export interface PostStationaryEquipmentDto {
    inventoryNumber: string;
    typeId: number;
    statusId: number;
    description: string | null;
}

export interface UpdateStationaryEquipmentDto {
    inventoryNumber: string;
    typeId: number;
    statusId: number;
    description: string | null;
}
