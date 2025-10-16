namespace DataLayer.DTOs.User
{
    public class UserDto
    {
        public int Id { get; set; }

        public int RoleId { get; set; }

        public string Surname { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Patronymic { get; set; }

        public string Login { get; set; } = null!;

        public string HashPassword { get; set; } = null!;

    }
}