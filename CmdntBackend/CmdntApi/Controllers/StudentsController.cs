using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.Group;
using DataLayer.DTOs.Student;
using DataLayer.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmdntApi.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    //[Authorize]
    public class StudentsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudentDto>>> GetAllStudents()
        {
            var students = await _context.Students
                .Include(s => s.Rooms)
                .Include(s => s.Group)
                .ToListAsync();

            if (students.Count == 0)
                return NotFound(new ApiErrorDto("Пользователи не найдены", StatusCodes.Status404NotFound));

            var studentsDto = students.Select(s => new StudentDto
            {
                Id = s.Id,
                Name = s.Name,
                Surname = s.Surname,
                Patronymic = s.Patronymic,
                Gender = s.Gender,
                Phone = s.Phone,
                Birthday = s.Birthday,
                Group = new GroupDto
                {
                    Id = s.Group.Id,
                    Course = s.Group.Course,
                    Name = s.Group.Name,
                },
                BlockNumber = s.Rooms.Count != 0
                                ? $"{s.Rooms.First().FloorNumber}{s.Rooms.First().RoomNumber:D2}"
                                : null

            });

            return Ok(studentsDto);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StudentDto>> GetStudent(int id)
        {
            var student = await _context.Students
                .Include(s => s.Rooms)
                .Include(s => s.Group)
               .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            var response = new StudentDto
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
                BlockNumber = student.Rooms.Count != 0
                               ? $"{student.Rooms.First().FloorNumber}{student.Rooms.First().RoomNumber:D2}"
                               : null
            };

            return Ok(response);
        }

        //[HttpPut("{id}")]
        //public async Task<IActionResult> PutStudent(int id, Student student)
        //{
        //    if (id != student.Id)
        //    {
        //        return BadRequest();
        //    }

        //    _context.Entry(student).State = EntityState.Modified;

        //    try
        //    {
        //        await _context.SaveChangesAsync();
        //    }
        //    catch (DbUpdateConcurrencyException)
        //    {
        //        if (!StudentExists(id))
        //        {
        //            return NotFound();
        //        }
        //        else
        //        {
        //            throw;
        //        }
        //    }

        //    return NoContent();
        //}

        [HttpPost]
        public async Task<ActionResult<StudentDto>> PostStudent(PostStudentDto dto)
        {
            var group = await _context.Groups
               .FirstOrDefaultAsync(s => s.Id == dto.GroupId);

            if (group is null)
                return NotFound(new ApiErrorDto("Группа не найдена", StatusCodes.Status404NotFound));

            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var student = new Student
            {
                Surname = dto.Surname,
                Name = dto.Name,
                Patronymic = dto.Patronymic,
                Gender = dto.Gender,
                Phone = dto.Phone,
                Birthday = dto.Birthday,
                GroupId = dto.GroupId,
                Origin = dto.Origin,
                IsHeadman = false
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            var dbStudent = await _context.Students
                 .Include(s => s.Rooms)
                 .Include(s => s.Group)
                .FirstOrDefaultAsync(s => s.Id == student.Id);

            var studentDto = new StudentDto
            {
                Id = dbStudent.Id,
                Name = dbStudent.Name,
                Surname = dbStudent.Surname,
                Patronymic = dbStudent.Patronymic,
                Gender = dbStudent.Gender,
                Phone = dbStudent.Phone,
                Birthday = dbStudent.Birthday,
                Group = new GroupDto
                {
                    Id = dbStudent.Group.Id,
                    Course = dbStudent.Group.Course,
                    Name = dbStudent.Group.Name,
                },
                BlockNumber = dbStudent.Rooms.Count != 0
                                ? $"{dbStudent.Rooms.First().FloorNumber}{dbStudent.Rooms.First().RoomNumber:D2}"
                                : null
            };

            return CreatedAtAction(nameof(GetStudent), new { id = student.Id }, studentDto);
        }

        //[HttpDelete("{id}")]
        //public async Task<IActionResult> DeleteStudent(int id)
        //{
        //    var student = await _context.Students.FindAsync(id);
        //    if (student == null)
        //    {
        //        return NotFound();
        //    }

        //    _context.Students.Remove(student);
        //    await _context.SaveChangesAsync();

        //    return NoContent();
        //}

        //private bool StudentExists(int id)
        //{
        //    return _context.Students.Any(e => e.Id == id);
        //}
    }
}
