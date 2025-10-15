namespace DataLayer.DTOs
{
    public class LoginResponseDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string Surname { get; set; } = null!;

        public string? Patronymic { get; set; }

        public int RoleId { get; set; }

        public string Login { get; set; } = null!;

        public string Token { get; set; } = null!;
    }
}