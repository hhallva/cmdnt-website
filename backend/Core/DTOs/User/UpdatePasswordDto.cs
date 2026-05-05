using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Users
{
    public class UpdatePasswordDto
    {
        [Required(ErrorMessage = "Новый пароль обязателен.")]
        [StringLength(100, MinimumLength = 5, ErrorMessage = "Пароль должен содержать от 5 до 100 символов.")]
        public string Password { get; set; } = null!;
    }
}