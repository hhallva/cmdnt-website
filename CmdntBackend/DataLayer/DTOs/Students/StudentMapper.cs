using DataLayer.DTOs.Group;
using DataLayer.Models;

namespace DataLayer.DTOs.Students
{
    public static class StudentMapper
    {
        public static StudentDto ToDto(this Student student)
        {
            ArgumentNullException.ThrowIfNull(student);

            return new StudentDto
            {
                Id = student.Id,
                Name = student.Name,
                Surname = student.Surname,
                Patronymic = student.Patronymic,
                Gender = student.Gender,
                Phone = student.Phone,
                Birthday = student.Birthday,
                Group = new GroupDto
                {
                    Id = student.Group.Id,
                    Course = student.Group.Course,
                    Name = student.Group.Name,
                },
                RoomId = student.Rooms.Count != 0
                               ? student.Rooms.First().Id
                               : null,
                BlockNumber = student.Rooms.Count != 0
                               ? $"{student.Rooms.First().FloorNumber}{student.Rooms.First().RoomNumber:D2}"
                               : null,
                Origin = student.Origin
            };
        }
    }
}
