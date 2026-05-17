export interface ExpendableDistributionStudentDto {
    id: number;
    fullName: string;
}

export interface ExpendableDistributionTypeDto {
    id: number;
    name: string;
    count: number;
}

export interface ExpendableDistributionDto {
    id: number;
    student: ExpendableDistributionStudentDto;
    types: ExpendableDistributionTypeDto[];
}

export interface ExpendableDistributionBatchItemDto {
    id: number;
    count: number;
}
