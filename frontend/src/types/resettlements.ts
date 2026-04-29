export interface ResettlementRoommateDto {
    id: number;
    fullName: string;
    groupName: string | null;
    groupCourse: number | null;
}

export interface ResettlementHistoryDto {
    resettlementId: number;
    roomId: number;
    roomNumber: string;
    floorNumber: number;
    buildingId: number;
    capacity: number;
    checkInDate: string;
    checkOutDate: string;
    roommates: ResettlementRoommateDto[];
}
