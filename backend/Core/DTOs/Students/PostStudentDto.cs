using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Students
{
    public class PostStudentDto
    {
        [Required(ErrorMessage = "Фамилия обязательна.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Фамилия должна содержать от 1 до 100 символов.")]
        public string Surname { get; set; } = null!;

        [Required(ErrorMessage = "Имя обязательно.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Имя должно содержать от 1 до 100 символов.")]
        public string Name { get; set; } = null!;

        [StringLength(100, ErrorMessage = "Отчество не может превышать 100 символов.")]
        public string? Patronymic { get; set; }

        [Required(ErrorMessage = "Пол обязателен.")]
        public bool Gender { get; set; }

        [StringLength(12, ErrorMessage = "Номер телефона должен содержать 12 символов")]
        [RegularExpression(@"^\+79\d{9}$", ErrorMessage = "Номер телефона должен быть в формате +79XXXXXXXXX")]
        public string? Phone { get; set; }

        public DateTime? Birthday { get; set; }

        [StringLength(300, MinimumLength = 1, ErrorMessage = "Место проживания должно содержать от 1 до 300 символов.")]
        public string? Origin { get; set; }

        [Required(ErrorMessage = "Группа обязательна.")]
        [Range(1, int.MaxValue, ErrorMessage = "Идентификатор группы должен быть положительным числом")]
        public int GroupId { get; set; }

        public string? Image { get; set; }
    }
}