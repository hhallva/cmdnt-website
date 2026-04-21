using Core.Data;
using Core.DTOs.Structures;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class StructureController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet("statistic")]
        [SwaggerOperation(
           Summary = "Получение статистики по структуре общежития",
           Description = "Возвращает сводную статистику: общее количество мест в общежитии, количество занятых мест, свободных, и общее количество заселенных студентов")]
        [SwaggerResponse(StatusCodes.Status200OK, "Статистика успешно получена.", Type = typeof(StructureStatisticDto))]
        public async Task<ActionResult<StructureStatisticDto>> GetStatistic()
        {
            var totalCapacity = await _context.Rooms.SumAsync(r => r.Capacity);

            var activeResettlements = _context.Resettlements
                .Where(r => r.CheckInDate.HasValue && !r.CheckOutDate.HasValue);

            var occupiedCount = await activeResettlements.CountAsync();

            var freeCount = totalCapacity - occupiedCount;

            var studentCount = await activeResettlements
                .Select(r => r.StudentId)
                .Distinct()
                .CountAsync();

            var statistic = new StructureStatisticDto
            {
                TotalCopacity = totalCapacity,
                OccupiedCount = occupiedCount,
                FreeCount = freeCount,
                StudentCount = studentCount
            };

            return Ok(statistic);
        }
    }
}
