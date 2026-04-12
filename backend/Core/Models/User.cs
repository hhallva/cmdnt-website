namespace Core.Models
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

        public virtual ICollection<Note> Notes { get; set; } = [];

        public virtual ICollection<Building> Buildings { get; set; } = [];
    }
}