using System.ComponentModel.DataAnnotations;

namespace DataLayer.DTOs.Group
{
    public class PostGroupDto
    {
        [Required(ErrorMessage = "Название группы обязательно.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Название группы должно содержать от 1 до 100 символов.")]
        public string Name { get; set; } = null!;

        [Range(1, 5, ErrorMessage = "Курс обучения может быть в диапазоне от 1 до 5.")]
        public int Course { get; set; }
    }
}
