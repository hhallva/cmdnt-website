namespace CmdntApi.Models
{
    public partial class User
    {
        public int Id { get; set; }

        public string Surname { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Patronymic { get; set; }

        public string Login { get; set; } = null!;

        public string HashPassword { get; set; } = null!;

        public int RoleId { get; set; }


        public virtual Role Role { get; set; } = null!;
    }
}
