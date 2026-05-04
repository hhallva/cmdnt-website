export interface ExpendableDistributionDto {
    id: number;
    studentId: number;
    studentFullName: string;
    typeId: number;
    typeName: string;
    count: number;
}

export interface ExpendableDistributionUpsertDto {
    studentId: number;
    typeId: number;
    count: number;
}
