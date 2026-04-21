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
