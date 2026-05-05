using Core.Data;
using Core.DTOs;
using Core.DTOs.ExpendableDistribution;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [SwaggerTag("Распределение расходных материалов")]
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class ExpendableDistributionController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение распределений расходников",
            Description = "Возвращает список распределений по студентам и типам расходных материалов.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список успешно получен.", Type = typeof(IEnumerable<ExpendableDistributionDto>))]
        public async Task<ActionResult<IEnumerable<ExpendableDistributionDto>>> GetDistributions()
        {
            var distributions = await _context.ExpendableDistributions
                .AsNoTracking()
                .Include(item => item.Student)
                .Include(item => item.Expendable)
                .ThenInclude(item => item.Type)
                .ToListAsync();

            return Ok(distributions.Select(item => item.ToDto()));
        }

        [HttpPost]
        [SwaggerOperation(
            Summary = "Добавление распределения расходников",
            Description = "Создает запись распределения расходников студенту.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Распределение успешно создано.", Type = typeof(ExpendableDistributionDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<ExpendableDistributionDto>> CreateDistribution(
            [SwaggerRequestBody("Данные для распределения", Required = true)] ExpendableDistributionUpsertDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var studentExists = await _context.Students.AnyAsync(student => student.Id == dto.StudentId);
            if (!studentExists)
                return BadRequest(new ApiErrorDto("Студент не найден", StatusCodes.Status400BadRequest));

            var equipment = await _context.ExpendableEquipments
                .Include(item => item.ExpendableDistributions)
                .Include(item => item.Type)
                .FirstOrDefaultAsync(item => item.TypeId == dto.TypeId);

            if (equipment == null)
                return BadRequest(new ApiErrorDto("Категория расходников не найдена", StatusCodes.Status400BadRequest));

            var used = equipment.ExpendableDistributions.Sum(dist => dist.Count);
            var available = equipment.Count - used;

            if (available < dto.Count)
                return BadRequest(new ApiErrorDto("Недостаточно расходников на складе", StatusCodes.Status400BadRequest));

            var distribution = new ExpendableDistribution
            {
                StudentId = dto.StudentId,
                ExpendableId = equipment.Id,
                Count = dto.Count,
            };

            _context.ExpendableDistributions.Add(distribution);
            await _context.SaveChangesAsync();

            var created = await _context.ExpendableDistributions
                .AsNoTracking()
                .Include(item => item.Student)
                .Include(item => item.Expendable)
                .ThenInclude(item => item.Type)
                .FirstAsync(item => item.Id == distribution.Id);

            return Ok(created.ToDto());
        }

        [HttpPut("{id:int}")]
        [SwaggerOperation(
            Summary = "Обновление распределения расходников",
            Description = "Обновляет данные распределения расходников для студента.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Распределение успешно обновлено.", Type = typeof(ExpendableDistributionDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Распределение не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<ExpendableDistributionDto>> UpdateDistribution(
            int id,
            [SwaggerRequestBody("Данные для обновления", Required = true)] ExpendableDistributionUpsertDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var distribution = await _context.ExpendableDistributions
                .Include(item => item.Expendable)
                .ThenInclude(item => item.Type)
                .Include(item => item.Student)
                .FirstOrDefaultAsync(item => item.Id == id);

            if (distribution == null)
                return NotFound(new ApiErrorDto("Распределение не найдено", StatusCodes.Status404NotFound));

            var studentExists = await _context.Students.AnyAsync(student => student.Id == dto.StudentId);
            if (!studentExists)
                return BadRequest(new ApiErrorDto("Студент не найден", StatusCodes.Status400BadRequest));

            var equipment = await _context.ExpendableEquipments
                .Include(item => item.ExpendableDistributions)
                .Include(item => item.Type)
                .FirstOrDefaultAsync(item => item.TypeId == dto.TypeId);

            if (equipment == null)
                return BadRequest(new ApiErrorDto("Категория расходников не найдена", StatusCodes.Status400BadRequest));

            var used = equipment.ExpendableDistributions
                .Where(dist => dist.Id != distribution.Id)
                .Sum(dist => dist.Count);
            var available = equipment.Count - used;

            if (available < dto.Count)
                return BadRequest(new ApiErrorDto("Недостаточно расходников на складе", StatusCodes.Status400BadRequest));

            distribution.StudentId = dto.StudentId;
            distribution.ExpendableId = equipment.Id;
            distribution.Count = dto.Count;

            await _context.SaveChangesAsync();

            var updated = await _context.ExpendableDistributions
                .AsNoTracking()
                .Include(item => item.Student)
                .Include(item => item.Expendable)
                .ThenInclude(item => item.Type)
                .FirstAsync(item => item.Id == distribution.Id);

            return Ok(updated.ToDto());
        }

        [HttpDelete("{id:int}")]
        [SwaggerOperation(
            Summary = "Удаление распределения расходников",
            Description = "Удаляет запись распределения расходников.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Распределение успешно удалено.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Распределение не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> DeleteDistribution(int id)
        {
            var distribution = await _context.ExpendableDistributions.FirstOrDefaultAsync(item => item.Id == id);
            if (distribution == null)
                return NotFound(new ApiErrorDto("Распределение не найдено", StatusCodes.Status404NotFound));

            _context.ExpendableDistributions.Remove(distribution);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
