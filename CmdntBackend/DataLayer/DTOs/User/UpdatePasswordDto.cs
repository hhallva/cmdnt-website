using System.ComponentModel.DataAnnotations;

namespace DataLayer.DTOs.User
{
    public class UpdatePasswordDto
    {
        [Required(ErrorMessage = "Новый пароль обязателен.")]
        [StringLength(100, MinimumLength = 5, ErrorMessage = "Пароль должен содержать от 5 до 100 символов.")]
        public string Password { get; set; } = null!;
    }
}