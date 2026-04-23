using Core.Data;
using Core.DTOs;
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

        [HttpGet("statistic/{buildingId}")]
        [SwaggerOperation(
           Summary = "Получение статистики по структуре общежития",
           Description = "Возвращает сводную статистику по зданию: общее количество мест, количество занятых и свободных мест, а также число заселенных студентов")]
        [SwaggerResponse(StatusCodes.Status200OK, "Статистика успешно получена.", Type = typeof(StructureStatisticDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Здание не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StructureStatisticDto>> GetStatistic(
            [SwaggerParameter(Description = "Идентификатор здания", Required = true)] int buildingId)
        {
            var buildingExists = await _context.Buildings.AnyAsync(b => b.Id == buildingId);
            if (!buildingExists)
            {
                return NotFound(new ApiErrorDto("Здание не найдено", StatusCodes.Status404NotFound));
            }

            var totalCapacity = await _context.Rooms
                .Where(r => r.BuildingId == buildingId)
                .Select(r => (int?)r.Capacity)
                .SumAsync() ?? 0;

            var activeResettlements = _context.Resettlements
                .Where(r => r.CheckInDate.HasValue && !r.CheckOutDate.HasValue)
                .Where(r => r.Room != null && r.Room.BuildingId == buildingId);

            var occupiedCount = await activeResettlements.CountAsync();

            var freeCount = totalCapacity - occupiedCount;

            var studentCount = await _context.Students
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

        [HttpGet("summary")]
        [SwaggerOperation(
           Summary = "Получение общей статистики по общежитиям",
           Description = "Возвращает сводную статистику: количество зданий, студентов, мест и заселенных студентов.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Общая статистика успешно получена.", Type = typeof(OverallStructureStatisticDto))]
        public async Task<ActionResult<OverallStructureStatisticDto>> GetOverallStatistic()
        {
            var totalBuildings = await _context.Buildings.CountAsync();
            var totalStudents = await _context.Students.CountAsync();
            var totalCapacity = await _context.Rooms.SumAsync(r => r.Capacity);

            var occupiedStudents = await _context.Resettlements
                .Where(r => r.CheckInDate.HasValue && !r.CheckOutDate.HasValue)
                .Select(r => r.StudentId)
                .Distinct()
                .CountAsync();

            var statistic = new OverallStructureStatisticDto
            {
                TotalBuildings = totalBuildings,
                TotalStudents = totalStudents,
                TotalCapacity = totalCapacity,
                OccupiedStudents = occupiedStudents
            };

            return Ok(statistic);
        }
    }
}
