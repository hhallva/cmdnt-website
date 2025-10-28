using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.Group;
using DataLayer.DTOs.Student;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmdntApi.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
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
                BlockNumber = s.Rooms.Any()
                                ? $"{s.Rooms.First().FloorNumber}{s.Rooms.First().RoomNumber:D2}"
                                : null

            });

            return Ok(studentsDto);
        }

        //[HttpGet("{id}")]
        //public async Task<ActionResult<Student>> GetStudent(int id)
        //{
        //    var student = await _context.Students.FindAsync(id);

        //    if (student == null)
        //    {
        //        return NotFound();
        //    }

        //    return student;
        //}

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

        //[HttpPost]
        //public async Task<ActionResult<Student>> PostStudent(Student student)
        //{
        //    _context.Students.Add(student);
        //    await _context.SaveChangesAsync();

        //    return CreatedAtAction("GetStudent", new { id = student.Id }, student);
        //}

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
