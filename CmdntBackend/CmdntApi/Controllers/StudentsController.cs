using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.Contacts;
using DataLayer.DTOs.Students;
using DataLayer.Models;
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

            return Ok(students.Select(s => s.ToDto()));
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

            return Ok(student.ToDto());
        }

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

            await _context.Students
                 .Include(s => s.Rooms)
                 .Include(s => s.Contacts)
                 .Include(s => s.Group)
                 .FirstOrDefaultAsync(s => s.Id == student.Id);

            return CreatedAtAction(nameof(GetStudent), new { id = student.Id }, student.ToDto());
        }

        [HttpGet("{id}/contacts")]
        public async Task<ActionResult<List<ContactDto>>> GetContacts(int id)
        {
            var studentExists = await _context.Students.AnyAsync(s => s.Id == id);
            if (!studentExists)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            var contacts = await _context.Contacts
                .Where(c => c.StudentId == id)
                .ToListAsync();

            return Ok(contacts.Select(c => new ContactDto(c.Comment, c.Phone)));
        }

        [HttpPost("{id}/contacts")]
        public async Task<ActionResult<List<ContactDto>>> PostContact(int id, List<ContactDto> dtos)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var studentExists = await _context.Students.AnyAsync(s => s.Id == id);
            if (!studentExists)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            var contacts = dtos.Select(cDto => new Contact
            {
                StudentId = id,
                Comment = cDto.Comment,
                Phone = cDto.Phone
            }).ToList();

            _context.Contacts.AddRange(contacts);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetContacts), new { id }, contacts.Select(c => c.ToDto()));
        }
    }
}
