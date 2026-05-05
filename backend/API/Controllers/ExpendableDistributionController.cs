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

            var grouped = distributions
                .GroupBy(item => item.StudentId)
                .Select(group => group.ToGroupedDto())
                .OrderBy(item => item.Student.FullName)
                .ToList();

            return Ok(grouped);
        }

        [HttpPost("student/{studentId:int}")]
        [SwaggerOperation(
            Summary = "Массовое добавление распределений студенту",
            Description = "Создает несколько записей распределения расходников для одного студента одним запросом.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Распределения успешно созданы.", Type = typeof(ExpendableDistributionDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<ExpendableDistributionDto>> CreateDistributionsForStudent(
            int studentId,
            [FromBody] List<ExpendableDistributionBatchItemDto> items)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            if (studentId <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор студента", StatusCodes.Status400BadRequest));

            if (items == null || items.Count == 0)
                return BadRequest(new ApiErrorDto("Список распределений не может быть пустым", StatusCodes.Status400BadRequest));

            var studentExists = await _context.Students.AnyAsync(student => student.Id == studentId);
            if (!studentExists)
                return BadRequest(new ApiErrorDto("Студент не найден", StatusCodes.Status400BadRequest));

            var duplicatedTypeIds = items
                .GroupBy(item => item.Id)
                .Where(group => group.Count() > 1)
                .Select(group => group.Key)
                .ToList();

            if (duplicatedTypeIds.Count != 0)
                return BadRequest(new ApiErrorDto("Категории расходников не должны повторяться в одном запросе", StatusCodes.Status400BadRequest));

            var typeIds = items.Select(item => item.Id).ToList();

            var equipmentByType = await _context.ExpendableEquipments
                .Include(item => item.ExpendableDistributions)
                .Include(item => item.Type)
                .Where(item => typeIds.Contains(item.TypeId))
                .ToDictionaryAsync(item => item.TypeId);

            foreach (var item in items)
            {
                if (!equipmentByType.TryGetValue(item.Id, out var equipment))
                    return BadRequest(new ApiErrorDto($"Категория расходников с ID={item.Id} не найдена", StatusCodes.Status400BadRequest));

                var used = equipment.ExpendableDistributions.Sum(dist => dist.Count);
                var available = equipment.Count - used;

                if (available < item.Count)
                    return BadRequest(new ApiErrorDto($"Недостаточно расходников на складе для категории с ID={item.Id}", StatusCodes.Status400BadRequest));
            }

            var entities = items.Select(item => new ExpendableDistribution
            {
                StudentId = studentId,
                ExpendableId = equipmentByType[item.Id].Id,
                Count = item.Count,
            });

            _context.ExpendableDistributions.AddRange(entities);
            await _context.SaveChangesAsync();

            var createdGrouped = await GetStudentGroupedDistributionAsync(studentId);
            return Ok(createdGrouped);
        }

        [HttpPut("student/{studentId:int}")]
        [SwaggerOperation(
            Summary = "Полная замена распределений студента",
            Description = "Полностью заменяет набор распределений расходников для студента одним запросом (upsert replace).")]
        [SwaggerResponse(StatusCodes.Status200OK, "Распределения успешно обновлены.", Type = typeof(ExpendableDistributionDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<ExpendableDistributionDto>> ReplaceStudentDistributions(
            int studentId,
            [FromBody] List<ExpendableDistributionBatchItemDto> items)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            if (studentId <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор студента", StatusCodes.Status400BadRequest));

            if (items == null)
                return BadRequest(new ApiErrorDto("Список распределений не передан", StatusCodes.Status400BadRequest));

            var studentExists = await _context.Students.AnyAsync(student => student.Id == studentId);
            if (!studentExists)
                return BadRequest(new ApiErrorDto("Студент не найден", StatusCodes.Status400BadRequest));

            var duplicatedTypeIds = items
                .GroupBy(item => item.Id)
                .Where(group => group.Count() > 1)
                .Select(group => group.Key)
                .ToList();

            if (duplicatedTypeIds.Count != 0)
                return BadRequest(new ApiErrorDto("Категории расходников не должны повторяться в одном запросе", StatusCodes.Status400BadRequest));

            var typeIds = items.Select(item => item.Id).ToList();

            var equipmentByType = await _context.ExpendableEquipments
                .Include(item => item.ExpendableDistributions)
                .Include(item => item.Type)
                .Where(item => typeIds.Contains(item.TypeId))
                .ToDictionaryAsync(item => item.TypeId);

            foreach (var item in items)
            {
                if (!equipmentByType.TryGetValue(item.Id, out var equipment))
                    return BadRequest(new ApiErrorDto($"Категория расходников с ID={item.Id} не найдена", StatusCodes.Status400BadRequest));

                var usedByOthers = equipment.ExpendableDistributions
                    .Where(dist => dist.StudentId != studentId)
                    .Sum(dist => dist.Count);

                var availableForStudent = equipment.Count - usedByOthers;
                if (availableForStudent < item.Count)
                    return BadRequest(new ApiErrorDto($"Недостаточно расходников на складе для категории с ID={item.Id}", StatusCodes.Status400BadRequest));
            }

            var existing = await _context.ExpendableDistributions
                .Where(item => item.StudentId == studentId)
                .ToListAsync();

            _context.ExpendableDistributions.RemoveRange(existing);

            var entities = items.Select(item => new ExpendableDistribution
            {
                StudentId = studentId,
                ExpendableId = equipmentByType[item.Id].Id,
                Count = item.Count,
            });

            _context.ExpendableDistributions.AddRange(entities);
            await _context.SaveChangesAsync();

            var updatedGrouped = await GetStudentGroupedDistributionAsync(studentId);
            return Ok(updatedGrouped);
        }

        private async Task<ExpendableDistributionDto> GetStudentGroupedDistributionAsync(int studentId)
        {
            var studentDistributions = await _context.ExpendableDistributions
                .AsNoTracking()
                .Include(item => item.Student)
                .Include(item => item.Expendable)
                .ThenInclude(item => item.Type)
                .Where(item => item.StudentId == studentId)
                .ToListAsync();

            if (studentDistributions.Count == 0)
            {
                var student = await _context.Students
                    .AsNoTracking()
                    .FirstAsync(item => item.Id == studentId);

                return new ExpendableDistributionDto
                {
                    Id = studentId,
                    Student = new ExpendableDistributionStudentDto
                    {
                        Id = student.Id,
                        FullName = BuildStudentFullName(student),
                    },
                    Types = [],
                };
            }

            return studentDistributions
                .GroupBy(item => item.StudentId)
                .Select(group => group.ToGroupedDto())
                .First();
        }

        private static string BuildStudentFullName(Student student)
        {
            return string.Join(" ", new[] { student.Surname, student.Name, student.Patronymic }
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Select(part => part!.Trim()));
        }
    }
}
