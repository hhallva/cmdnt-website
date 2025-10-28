using DataLayer.DTOs.Group;

namespace DataLayer.DTOs.Student
{
    public class StudentDto
    {
        public int Id { get; set; }

        public string Surname { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Patronymic { get; set; }

        public bool Gender { get; set; }

        public string? Phone { get; set; }

        public DateTime? Birthday { get; set; }

        public GroupDto Group { get; set; } = null!;

        public string? BlockNumber { get; set; }
    }
}