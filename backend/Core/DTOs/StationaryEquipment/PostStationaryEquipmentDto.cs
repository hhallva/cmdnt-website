using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.StationaryEquipment
{
    public class PostStationaryEquipmentDto
    {
        [Required(ErrorMessage = "Инвентарный номер обязателен.")]
        [RegularExpression(@"^[A-Za-z0-9]{6}$", ErrorMessage = "Инвентарный номер должен содержать 6 символов (латиница/цифры).")]
        public string InventoryNumber { get; set; } = null!;

        [Range(1, int.MaxValue, ErrorMessage = "Категория обязательна.")]
        public int TypeId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Статус обязателен.")]
        public int StatusId { get; set; }

        [StringLength(300, ErrorMessage = "Описание не должно превышать 300 символов.")]
        public string? Description { get; set; }
    }
}
