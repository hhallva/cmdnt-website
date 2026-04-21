using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Users
{
    public class PutUserDto
    {
        [Required(ErrorMessage = "Идентификатор роли обязателен.")]
        [Range(1, 3, ErrorMessage = "Идентификатор роли должен быть положительным числом.")]
        public int RoleId { get; set; }

        [Required(ErrorMessage = "Фамилия обязательна.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Фамилия должна содержать от 1 до 100 символов.")]
        public string Surname { get; set; } = null!;

        [Required(ErrorMessage = "Имя обязательно.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Имя должно содержать от 1 до 100 символов.")]
        public string Name { get; set; } = null!;

        [StringLength(100, ErrorMessage = "Отчество не должно превышать 100 символов.")]
        public string? Patronymic { get; set; }

        [Required(ErrorMessage = "Логин обязателен.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Логин должен содержать от 3 до 50 символов.")]
        [RegularExpression(@"^[a-zA-Z0-9_\-\.]+$", ErrorMessage = "Логин может содержать только буквы, цифры, подчёркивания, дефисы и точки.")]
        public string Login { get; set; } = null!;
    }
}
