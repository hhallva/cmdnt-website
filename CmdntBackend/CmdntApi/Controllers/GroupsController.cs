using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.Group;
using DataLayer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace CmdntApi.Controllers
{
    [SwaggerTag("Управление группами обучения")]
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GroupsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение списка всех групп обучения",
            Description = "Возвращает полный список учебных групп в системе.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список групп успешно получен.", Type = typeof(IEnumerable<GroupDto>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Группы не найдены.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<IEnumerable<GroupDto>>> GetAllGroups()
        {
            var gorups = await _context.Groups
                 .Select(g => new GroupDto
                 {
                     Id = g.Id,
                     Name = g.Name,
                     Course = g.Course
                 }).ToListAsync();

            if (gorups.Count == 0)
                return NotFound(new ApiErrorDto("Группы не найдены", StatusCodes.Status404NotFound));
            return Ok(gorups);
        }

        [HttpGet("{id}")]
        [SwaggerOperation(
            Summary = "Получение группы по ID",
            Description = "Возвращает данные учебной группы по её уникальному идентификатору.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Группа успешно найдена.", Type = typeof(GroupDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Группа с указанным ID не найдена.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<GroupDto>> GetGroup(
            [SwaggerParameter(Description = "Уникальный идентификатор группы", Required = true)] int id)
        {
            var group = await _context.Groups.FindAsync(id);

            if (group == null)
                return NotFound(new ApiErrorDto("Группа не найдены", StatusCodes.Status404NotFound));

            var response = new GroupDto
            {
                Id = group.Id,
                Name = group.Name,
                Course = group.Course
            };

            return Ok(response);
        }

        [HttpPost]
        [SwaggerOperation(
            Summary = "Создание новой группы обучения",
            Description = "Регистрирует новую учебную группу с указанием названия и курса.")]
        [SwaggerResponse(StatusCodes.Status201Created, "Группа успешно создана.", Type = typeof(GroupDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации или группа с таким названием уже существует.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<GroupDto>> PostGroup(
            [SwaggerRequestBody("Данные новой группы", Required = true)] PostGroupDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var existingGroup = await _context.Groups.FirstOrDefaultAsync(g => g.Name == dto.Name);
            if (existingGroup != null)
                return BadRequest(new ApiErrorDto("Группа с таким названием уже существует", StatusCodes.Status400BadRequest));

            var group = new Group
            {
                Name = dto.Name,
                Course = dto.Course
            };

            _context.Groups.Add(group);
            await _context.SaveChangesAsync();

            var groupDto = new GroupDto
            {
                Id = group.Id,
                Name = group.Name,
                Course = group.Course
            };

            return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, groupDto);
        }


        [HttpDelete("{id}")]
        [SwaggerOperation(
            Summary = "Удаление группы обучения",
            Description = "Удаляет учебную группу по её ID. Удаление невозможно, если в группе есть хотя бы один студент.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Группа успешно удалена.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Группа не найдена или содержит студентов.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> DeleteGroup(
            [SwaggerParameter(Description = "Уникальный идентификатор группы", Required = true)] int id)
        {
            var group = await _context.Groups
                 .Include(g => g.Students)
                 .FirstOrDefaultAsync(u => u.Id == id);

            if (group == null)
                return NotFound(new ApiErrorDto("Пользователь не найден", StatusCodes.Status404NotFound));
            if (group.Students.Count != 0)
                return NotFound(new ApiErrorDto("Группу нельзя удалить, пока в ней обучаются студенты", StatusCodes.Status404NotFound));

            _context.Groups.Remove(group);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
