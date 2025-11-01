using System.ComponentModel.DataAnnotations;

namespace DataLayer.DTOs.User
{
    public class PostUserDto
    {
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
        public string Login { get; set; } = null!;

        [Required(ErrorMessage = "Пароль обязателен.")]
        [StringLength(100, MinimumLength = 5, ErrorMessage = "Пароль должен содержать от 5 до 100 символов.")]
        public string Password { get; set; } = null!;

        [Range(1, 3, ErrorMessage = "Идентификатор роли должен быть в диапазоне от 1 до 3. Где 1 - Администратор, 2 - Комендант, 3 - Воспитатель.")]
        public int RoleId { get; set; }
    }
}
