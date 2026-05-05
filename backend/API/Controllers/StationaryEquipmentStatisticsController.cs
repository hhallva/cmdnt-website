using Core.Data;
using Core.DTOs.StationaryEquipment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [SwaggerTag("Статистика по стационарному оборудованию")]
    [Route("api/v1/StationaryEquipment/statistic")]
    [ApiController]
    [Authorize]
    public class StationaryEquipmentStatisticsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение статистики по мебели",
            Description = "Возвращает количество всех объектов, используемых, на складе и в ремонте.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Статистика успешно получена.", Type = typeof(StationaryEquipmentStatisticDto))]
        public async Task<ActionResult<StationaryEquipmentStatisticDto>> GetStatistic()
        {
            var equipment = await _context.StationaryEquipments
                .AsNoTracking()
                .Select(item => new
                {
                    item.RoomId,
                    StatusName = item.Status.Name
                })
                .ToListAsync();

            static bool IsRepair(string? statusName)
            {
                if (string.IsNullOrWhiteSpace(statusName))
                {
                    return false;
                }

                return statusName.Contains("ремонт", StringComparison.OrdinalIgnoreCase)
                    || statusName.Contains("сломано", StringComparison.OrdinalIgnoreCase);
            }

            var repairCount = equipment.Count(item => IsRepair(item.StatusName));
            var inUseCount = equipment.Count(item => item.RoomId.HasValue && !IsRepair(item.StatusName));
            var storageCount = equipment.Count(item => !item.RoomId.HasValue && !IsRepair(item.StatusName));

            var statistic = new StationaryEquipmentStatisticDto
            {
                TotalCount = equipment.Count,
                InUseCount = inUseCount,
                StorageCount = storageCount,
                RepairCount = repairCount,
            };

            return Ok(statistic);
        }
    }
}
