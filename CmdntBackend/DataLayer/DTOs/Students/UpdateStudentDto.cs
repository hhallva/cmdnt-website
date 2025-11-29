using DataLayer.DTOs.Contacts;

namespace DataLayer.DTOs.Students
{
    public class UpdateStudentDto
    {
        public StudentDto Student { get; set; } = null!;

        public List<ContactDto> Contacts { get; set; } = [];
    }
}
