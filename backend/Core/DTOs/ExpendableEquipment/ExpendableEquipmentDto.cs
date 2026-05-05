namespace Core.DTOs.ExpendableEquipment
{
    public class ExpendableEquipmentDto
    {
        public int TypeId { get; set; }

        public string TypeName { get; set; } = null!;

        public int TotalCount { get; set; }

        public int UsedCount { get; set; }

        public int InStockCount { get; set; }
    }
}
