using Core.DTOs.Types;

namespace Core.DTOs.ExpendableEquipment
{
    public class ExpendableEquipmentDto
    {
        public TypeDto Type { get; set; } = null!;

        public int TotalCount { get; set; }

        public int UsedCount { get; set; }

        public int InStockCount { get; set; }
    }
}
