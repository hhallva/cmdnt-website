using Core.Data;
using Core.DTOs;
using Core.DTOs.Types;
using Core.DTOs.ExpendableDistributions;
using Core.DTOs.ExpendableEquipment;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [SwaggerTag("Управление расходными материалами и их распределением")]
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class ExpendableController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение списка расходников",
            Description = "Возвращает список расходных материалов с количеством, использованием и остатком на складе.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список успешно получен.", Type = typeof(IEnumerable<ExpendableEquipmentDto>))]
        public async Task<ActionResult<IEnumerable<ExpendableEquipmentDto>>> GetExpendableEquipment()
        {
            var items = await _context.ExpendableTypes
                .AsNoTracking()
                .Select(type => new
                {
                    type.Id,
                    type.Name,
                    TotalCount = type.ExpendableEquipments.Sum(e => (int?)e.Count) ?? 0,
                    UsedCount = type.ExpendableEquipments
                        .SelectMany(e => e.ExpendableDistributions)
                        .Sum(d => (int?)d.Count) ?? 0,
                })
                .ToListAsync();

            var result = items.Select(item => new ExpendableEquipmentDto
            {
                Type = new TypeDto
                {
                    Id = item.Id,
                    Name = item.Name,
                },
                TotalCount = item.TotalCount,
                UsedCount = item.UsedCount,
                InStockCount = item.TotalCount - item.UsedCount,
            });

            return Ok(result);
        }

        [HttpPost("{id}")]
        [SwaggerOperation(
            Summary = "Добавление расходников",
            Description = "Увеличивает количество расходников выбранной категории по её идентификатору.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Количество успешно увеличено.", Type = typeof(ExpendableEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<ExpendableEquipmentDto>> AddExpendableEquipment(
            int id,
            [FromBody, SwaggerRequestBody("Данные для добавления (количество)", Required = true)] ExpendableEquipmentAdjustmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            if (id <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор категории", StatusCodes.Status400BadRequest));

            var typeExists = await _context.ExpendableTypes.AnyAsync(type => type.Id == id);
            if (!typeExists)
                return BadRequest(new ApiErrorDto("Категория не найдена", StatusCodes.Status400BadRequest));

            var equipment = await _context.ExpendableEquipments
                .FirstOrDefaultAsync(item => item.TypeId == id);

            if (equipment == null)
            {
                equipment = new ExpendableEquipment
                {
                    TypeId = id,
                    Count = dto.Count,
                };
                _context.ExpendableEquipments.Add(equipment);
            }
            else
            {
                equipment.Count += dto.Count;
            }

            await _context.SaveChangesAsync();

            return Ok(await BuildSummaryAsync(id));
        }

        [HttpDelete("{id}")]
        [SwaggerOperation(
            Summary = "Списание расходников",
            Description = "Уменьшает количество расходников выбранной категории по её идентификатору.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Количество успешно уменьшено.", Type = typeof(ExpendableEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<ExpendableEquipmentDto>> SubtractExpendableEquipment(
            int id,
            [FromBody, SwaggerRequestBody("Данные для списания (количество)", Required = true)] ExpendableEquipmentAdjustmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            if (id <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор категории", StatusCodes.Status400BadRequest));

            var typeExists = await _context.ExpendableTypes.AnyAsync(type => type.Id == id);
            if (!typeExists)
                return BadRequest(new ApiErrorDto("Категория не найдена", StatusCodes.Status400BadRequest));

            var equipmentList = await _context.ExpendableEquipments
                .Where(item => item.TypeId == id)
                .Select(item => new
                {
                    Entity = item,
                    Used = item.ExpendableDistributions.Sum(dist => (int?)dist.Count) ?? 0,
                })
                .ToListAsync();

            if (equipmentList.Count == 0)
                return BadRequest(new ApiErrorDto("Расходники не найдены", StatusCodes.Status400BadRequest));

            var availableTotal = equipmentList.Sum(item => item.Entity.Count - item.Used);
            if (availableTotal < dto.Count)
                return BadRequest(new ApiErrorDto("Недостаточно расходников на складе", StatusCodes.Status400BadRequest));

            var remaining = dto.Count;
            foreach (var item in equipmentList.OrderByDescending(item => item.Entity.Count - item.Used))
            {
                var available = item.Entity.Count - item.Used;
                if (available <= 0)
                {
                    continue;
                }

                var take = Math.Min(available, remaining);
                item.Entity.Count -= take;
                remaining -= take;
                if (remaining == 0)
                {
                    break;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(await BuildSummaryAsync(id));
        }

        [HttpGet("distribution")]
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

        [HttpPost("distribution/student/{studentId:int}")]
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

        [HttpPut("distribution/student/{studentId:int}")]
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

        private async Task<ExpendableEquipmentDto> BuildSummaryAsync(int typeId)
        {
            var item = await _context.ExpendableTypes
                .AsNoTracking()
                .Where(type => type.Id == typeId)
                .Select(type => new
                {
                    type.Id,
                    type.Name,
                    TotalCount = type.ExpendableEquipments.Sum(e => (int?)e.Count) ?? 0,
                    UsedCount = type.ExpendableEquipments
                        .SelectMany(e => e.ExpendableDistributions)
                        .Sum(d => (int?)d.Count) ?? 0,
                })
                .FirstAsync();

            return new ExpendableEquipmentDto
            {
                Type = new TypeDto
                {
                    Id = item.Id,
                    Name = item.Name,
                },
                TotalCount = item.TotalCount,
                UsedCount = item.UsedCount,
                InStockCount = item.TotalCount - item.UsedCount,
            };
        }

        private static string BuildStudentFullName(Student student)
        {
            return string.Join(" ", new[] { student.Surname, student.Name, student.Patronymic }
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Select(part => part!.Trim()));
        }
    }
}