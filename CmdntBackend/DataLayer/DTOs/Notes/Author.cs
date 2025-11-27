using DataLayer.DTOs;

namespace DataLayer.DTOs.Notes
{
    public partial class Author
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public RoleDto? Role { get; set; }
    }
}