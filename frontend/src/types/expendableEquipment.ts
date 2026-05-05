export interface ExpendableEquipmentDto {
    typeId: number;
    typeName: string;
    totalCount: number;
    usedCount: number;
    inStockCount: number;
}

export interface ExpendableEquipmentAdjustmentDto {
    typeId: number;
    count: number;
}
