namespace DataLayer.DTOs.User
{
    public class UserDto
    {
        public int Id { get; set; }

        public RoleDto Role { get; set; } = null!;

        public string Surname { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Patronymic { get; set; }

        public string Login { get; set; } = null!;
    }
}