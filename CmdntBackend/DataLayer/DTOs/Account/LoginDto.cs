using System.ComponentModel.DataAnnotations;

namespace DataLayer.DTOs.Account
{
    public class LoginDto
    {
        public string Login { get; set; } = null!;

        public string Password { get; set; } = null!;
    }
}
