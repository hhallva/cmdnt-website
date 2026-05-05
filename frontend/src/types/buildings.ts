export interface CoordinatesDto {
    latitude: number | null;
    longitude: number | null;
}

export interface BuildingDto {
    id: number;
    name: string;
    address: string;
    coordinates: CoordinatesDto;
}

export interface PostBuildingDto {
    name: string;
    address: string;
    coordinates: CoordinatesDto;
}

export interface BuildingSummaryDto {
    totalCapacity: number;
    totalFloors: number;
    occupiedCount: number;
}
