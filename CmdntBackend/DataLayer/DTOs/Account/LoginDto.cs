using System.ComponentModel.DataAnnotations;

namespace DataLayer.DTOs.Account
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Почта обязательна для заполнения.")]
        [StringLength(100, ErrorMessage = "Логин не должен превышать 100 символов.")]
        public string Login { get; set; } = null!;

        [Required(ErrorMessage = "Пароль обязателен для заполнения.")]
        [StringLength(100, MinimumLength = 5, ErrorMessage = "Пароль должен быть от 5 до 100 символов.")]
        public string Password { get; set; } = null!;
    }
}
