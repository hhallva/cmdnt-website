using Core.Data;
using Core.DTOs;
using Core.DTOs.ExpendableEquipment;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [SwaggerTag("Управление расходными материалами")]
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class ExpendableEquipmentController(AppDbContext context) : ControllerBase
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
                TypeId = item.Id,
                TypeName = item.Name,
                TotalCount = item.TotalCount,
                UsedCount = item.UsedCount,
                InStockCount = item.TotalCount - item.UsedCount,
            });

            return Ok(result);
        }

        [HttpPost("add")]
        [SwaggerOperation(
            Summary = "Добавление расходников",
            Description = "Увеличивает количество расходников выбранной категории.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Количество успешно увеличено.", Type = typeof(ExpendableEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<ExpendableEquipmentDto>> AddExpendableEquipment(
            [SwaggerRequestBody("Данные для добавления", Required = true)] ExpendableEquipmentAdjustmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var typeExists = await _context.ExpendableTypes.AnyAsync(type => type.Id == dto.TypeId);
            if (!typeExists)
                return BadRequest(new ApiErrorDto("Категория не найдена", StatusCodes.Status400BadRequest));

            var equipment = await _context.ExpendableEquipments
                .FirstOrDefaultAsync(item => item.TypeId == dto.TypeId);

            if (equipment == null)
            {
                equipment = new ExpendableEquipment
                {
                    TypeId = dto.TypeId,
                    Count = dto.Count,
                };
                _context.ExpendableEquipments.Add(equipment);
            }
            else
            {
                equipment.Count += dto.Count;
            }

            await _context.SaveChangesAsync();

            return Ok(await BuildSummaryAsync(dto.TypeId));
        }

        [HttpPost("subtract")]
        [SwaggerOperation(
            Summary = "Списание расходников",
            Description = "Уменьшает количество расходников выбранной категории.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Количество успешно уменьшено.", Type = typeof(ExpendableEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<ExpendableEquipmentDto>> SubtractExpendableEquipment(
            [SwaggerRequestBody("Данные для списания", Required = true)] ExpendableEquipmentAdjustmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var typeExists = await _context.ExpendableTypes.AnyAsync(type => type.Id == dto.TypeId);
            if (!typeExists)
                return BadRequest(new ApiErrorDto("Категория не найдена", StatusCodes.Status400BadRequest));

            var equipmentList = await _context.ExpendableEquipments
                .Where(item => item.TypeId == dto.TypeId)
                .Select(item => new
                {
                    Entity = item,
                    Used = item.ExpendableDistributions.Sum(dist => (int?)dist.Count) ?? 0,
                })
                .ToListAsync();

            if (!equipmentList.Any())
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

            return Ok(await BuildSummaryAsync(dto.TypeId));
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
                TypeId = item.Id,
                TypeName = item.Name,
                TotalCount = item.TotalCount,
                UsedCount = item.UsedCount,
                InStockCount = item.TotalCount - item.UsedCount,
            };
        }
    }
}
