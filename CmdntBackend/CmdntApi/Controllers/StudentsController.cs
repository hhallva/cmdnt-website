using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.Contacts;
using DataLayer.DTOs.Students;
using DataLayer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace CmdntApi.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class StudentsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение списка всех студентов",
            Description = "Возвращает полный список студентов, включая данные об их учебной группе и закреплённых комнатах.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список студентов успешно получен.", Type = typeof(IEnumerable<StudentDto>))]
        public async Task<ActionResult<IEnumerable<StudentDto>>> GetAllStudents()
        {
            var students = await _context.Students
                .Include(s => s.Rooms)
                .Include(s => s.Group)
                .ToListAsync();

            return Ok(students.Select(s => s.ToDto()));

        }

        [HttpGet("{id}")]
        [SwaggerOperation(
            Summary = "Получение данных студента по ID",
            Description = "Возвращает информацию о студенте, включая данные об учебной группе и список комнат, в которых он состоит.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Студент успешно найден.", Type = typeof(StudentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Неверный идентификатор студента.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Студент с указанным ID не найден.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StudentDto>> GetStudent(
            [SwaggerParameter("Уникальный идентификатор студента", Required = true)] int id)
        {
            if (id <= 0)
                return BadRequest(new ApiErrorDto("Неверный идентификатор студента", StatusCodes.Status400BadRequest));

            var student = await _context.Students
                .Include(s => s.Rooms)
                .Include(s => s.Group)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            return Ok(student.ToDto());
        }

        [HttpGet("{id}/extended")]
        public async Task<ActionResult<ExtStudentData>> GetOrigin(int id)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));
            


            return Ok(new ExtStudentData(student.Origin));
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
        [SwaggerOperation(
            Summary = "Получение контактной информации студента",
            Description = "Возвращает все контакты (телефон и комментарий), привязанные к студенту по его идентификатору.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Контакты успешно получены.", Type = typeof(List<ContactDto>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Студент с указанным ID не найден.", Type = typeof(ApiErrorDto))]
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

        [HttpDelete("{id}")]
        [SwaggerOperation(
          Summary = "Удаление данных студента",
          Description = "Удаляет студента из системы. При этом удаляются все связанные контакты и его заселение.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Студент успешно удалён.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Студент не найден.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> DeleteStudent(
          [SwaggerParameter("id", Description = "Уникальный идентификатор студента")] int id)
        {
            var student = await _context.Students
                .Include(s => s.Contacts)
                .Include(s => s.Rooms)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (student == null)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            if (student.Contacts.Count != 0)
                _context.Contacts.RemoveRange(student.Contacts);
            _context.Students.Remove(student);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/assign-room/{roomId}")]
        [SwaggerOperation(
            Summary = "Привязка студента к комнате",
            Description = "Привязывает студента к указанной комнате, проверяя соответствие пола студента, других жильцов и вместимость комнаты.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Студент успешно привязан к комнате.")]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Некорректные данные, студент уже привязан к комнате или комната переполнена.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Студент или комната не найдены.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> AssignRoom(
            [SwaggerParameter("ID студента", Required = true)] int id,
            [SwaggerParameter("ID комнаты", Required = true)] int roomId)
        {
            if (id <= 0 || roomId <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор студента или комнаты", StatusCodes.Status400BadRequest));

            var student = await _context.Students
                .Include(s => s.Rooms)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            if (student.Rooms.Any())
                return BadRequest(new ApiErrorDto("Студент уже привязан к комнате", StatusCodes.Status400BadRequest));

            var room = await _context.Rooms
                .Include(r => r.Students)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null)
                return NotFound(new ApiErrorDto("Комната не найдена", StatusCodes.Status404NotFound));

            if (room.Students.Count >= room.Capacity)
                return BadRequest(new ApiErrorDto("Комната переполнена", StatusCodes.Status400BadRequest));

            var hasGenderConflict = room.Students.Any(s => s.Gender != student.Gender);
            if (hasGenderConflict)
                return BadRequest(new ApiErrorDto("Студент не может быть заселен в комнату с жильцами другого пола", StatusCodes.Status400BadRequest));

            room.Students.Add(student);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Студент успешно привязан к комнате" });
        }

        [HttpPost("{id}/evict-room")]
        [SwaggerOperation(
            Summary = "Выселение студента из комнаты",
            Description = "Выселяет студента из всех комнат, в которых он проживает. В бизнес-логике студент может жить только в одной комнате.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Студент успешно выселен из комнаты.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Студент не найден.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> EvictRoom(
            [SwaggerParameter("ID студента", Required = true)] int id)
        {
            if (id <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор студента", StatusCodes.Status400BadRequest));

            var student = await _context.Students
                .Include(s => s.Rooms)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
                return NotFound(new ApiErrorDto("Студент не найден", StatusCodes.Status404NotFound));

            if (student.Rooms.Count != 0)
            {
                foreach (var room in student.Rooms.ToList())
                {
                    room.Students.Remove(student);
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { Message = "Студент успешно выселен из комнаты" });
        }


    }
}
