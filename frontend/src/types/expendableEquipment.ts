export interface TypeDto {
    id: number;
    name: string;
}

export interface ExpendableEquipmentDto {
    type: TypeDto;
    totalCount: number;
    usedCount: number;
    inStockCount: number;
}

export interface ExpendableEquipmentAdjustmentDto {
    typeId: number;
    count: number;
}
