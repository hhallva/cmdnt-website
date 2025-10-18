using System.ComponentModel.DataAnnotations;

namespace DataLayer.DTOs.Room
{
    public class UpdateCapacityDto
    {
        [Required(ErrorMessage = "Вместительность комнаты обязательна.")]
        [Range(1, int.MaxValue, ErrorMessage = "Объем вместительности может быть только положительным числом")]
        public int Capacity { get; set; }
    }
}
