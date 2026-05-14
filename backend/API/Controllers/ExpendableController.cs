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
        public async Task<IActionResult> GetDistributions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] bool all = false,
            [FromQuery] string? search = null,
            [FromQuery] string? studentIds = null)
        {
            if (page <= 0)
                return BadRequest(new ApiErrorDto("Номер страницы должен быть больше 0", StatusCodes.Status400BadRequest));

            var normalizedPageSize = pageSize > 0 ? pageSize : 50;

            var studentIdValues = string.IsNullOrWhiteSpace(studentIds)
                ? []
                : studentIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(value => int.TryParse(value, out var parsed) ? parsed : (int?)null)
                    .Where(value => value.HasValue)
                    .Select(value => value!.Value)
                    .Distinct()
                    .ToArray();

            var query = _context.ExpendableDistributions
                .AsNoTracking()
                .Include(item => item.Student)
                .Include(item => item.Expendable)
                .ThenInclude(item => item.Type)
                .AsQueryable();

            if (studentIdValues.Length > 0)
                query = query.Where(item => studentIdValues.Contains(item.StudentId));

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchPattern = $"%{search.Trim()}%";
                query = query.Where(item =>
                    EF.Functions.Like(item.Student.Surname, searchPattern)
                    || EF.Functions.Like(item.Student.Name, searchPattern)
                    || (item.Student.Patronymic != null && EF.Functions.Like(item.Student.Patronymic, searchPattern)));
            }

            var distributions = await query.ToListAsync();

            var grouped = distributions
                .GroupBy(item => item.StudentId)
                .Select(group => group.ToGroupedDto())
                .OrderBy(item => item.Student.FullName)
                .ToList();

            if (all)
            {
                return Ok(grouped);
            }

            var totalCount = grouped.Count;
            var pageItems = grouped
                .Skip((page - 1) * normalizedPageSize)
                .Take(normalizedPageSize)
                .ToList();

            return Ok(new PaginatedResponseDto<ExpendableDistributionDto>
            {
                Items = pageItems,
                Page = page,
                PageSize = normalizedPageSize,
                TotalCount = totalCount,
            });
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
    }
}