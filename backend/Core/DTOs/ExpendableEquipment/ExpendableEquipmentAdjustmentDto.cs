using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.ExpendableEquipment
{
    public class ExpendableEquipmentAdjustmentDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Количество должно быть больше 0")]
        public int Count { get; set; }
    }
}
