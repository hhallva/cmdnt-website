using DataLayer.Data;
using DataLayer.DTOs.Structures;
using DataLayer.DTOs.Users;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace CmdntApi.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
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

            var occupiedCount = await _context.Rooms
                .SelectMany(r => r.Students)
                .CountAsync();

            var freeCount = totalCapacity - occupiedCount;

            var studentCount = await _context.Rooms
                .SelectMany(r => r.Students)
                .Select(s => s.Id)
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

        [HttpGet]
        [SwaggerOperation(
           Summary = "Получение данных структуре общежития",
           Description = "Возвращает данные по этажам и комнатам общежития")]
        [SwaggerResponse(StatusCodes.Status200OK, "Данные успешно получены.", Type = typeof(StructureStatisticDto))]
        public async Task<ActionResult<StructureStatisticDto>> GetStructure()
        {
            var totalCapacity = await _context.Rooms.SumAsync(r => r.Capacity);

            var occupiedCount = await _context.Rooms
                .SelectMany(r => r.Students)
                .CountAsync();

            var freeCount = totalCapacity - occupiedCount;

            var studentCount = await _context.Rooms
                .SelectMany(r => r.Students)
                .Select(s => s.Id)
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
