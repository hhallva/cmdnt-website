using Core.DTOs.Group;

namespace Core.DTOs.Students
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

        public int? RoomId { get; set; }

        public int? BuildingId { get; set; }

        public int? RoomCapacity { get; set; }

        public string? BlockNumber { get; set; }

        public string? Origin { get; set; }
    }
}