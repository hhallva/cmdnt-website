using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Buildings
{
    public class PostBuildingDto
    {
        [Required(ErrorMessage = "Название здания обязательно.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Название группы должно содержать от 1 до 100 символов.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Адрес обязателен.")]
        [StringLength(300, MinimumLength = 1, ErrorMessage = "Название группы должно содержать от 1 до 300 символов.")]
        public string Address { get; set; } = null!;

        [Required(ErrorMessage = "Координаты обязательны.")]
        public Coordinates Coordinates { get; set; } = null!;
    }
}
