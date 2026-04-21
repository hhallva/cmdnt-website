using Core.DTOs.Group;
using Core.Models;

namespace Core.DTOs.Students
{
    public static class StudentMapper
    {
        public static StudentDto ToDto(this Student student)
        {
            ArgumentNullException.ThrowIfNull(student);

            var activeResettlement = student.Resettlements
                .FirstOrDefault(resettlement =>
                    resettlement.CheckInDate.HasValue && !resettlement.CheckOutDate.HasValue);

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
                RoomId = activeResettlement?.Room.Id,
                BlockNumber = activeResettlement == null
                    ? null
                    : $"{activeResettlement.Room.FloorNumber}{activeResettlement.Room.RoomNumber:D2}",
                Origin = student.Origin
            };
        }
    }
}
