namespace DataLayer.DTOs.Account
{
    public class LoginResponseDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string Surname { get; set; } = null!;

        public string? Patronymic { get; set; }

        public RoleDto Role { get; set; } = null!;

        public string Login { get; set; } = null!;

        public string Token { get; set; } = null!;
    }
}