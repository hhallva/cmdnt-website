using Core.Data;
using Core.DTOs;
using Core.DTOs.Buildings;
using Core.DTOs.Rooms;
using Core.DTOs.Structures;
using Core.DTOs.Students;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [SwaggerTag("Управление строениями")]
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class BuildingsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        #region Здания
        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение списка всех зданий",
            Description = "Возвращает полный список зданий в системе.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список зданий успешно получен.", Type = typeof(IEnumerable<BuildingDto>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Здания не найдены.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<IEnumerable<BuildingDto>>> GetAllBuildings()
        {
            var buildings = await _context.Buildings
                 .ToListAsync();

            return Ok(buildings.Select(b => b.ToDto()));
        }

        [HttpGet("{id}")]
        [SwaggerOperation(
            Summary = "Получение здания по ID",
            Description = "Возвращает данные о здании общежития по его уникальному идентификатору.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Здание успешно найдено.", Type = typeof(BuildingDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Здание с указанным ID не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<BuildingDto>> GetBuilding(
            [SwaggerParameter(Description = "Уникальный идентификатор здания", Required = true)] int id)
        {
            var building = await _context.Buildings.FindAsync(id);

            if (building == null)
                return NotFound(new ApiErrorDto("Здание не найдено", StatusCodes.Status404NotFound));

            return Ok(building.ToDto());
        }

        [HttpGet("{id}/summary")]
        [SwaggerOperation(
            Summary = "Получение сводки по зданию",
            Description = "Возвращает информацию для модального окна здания: количество этажей, мест и заселенных мест.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Сводка по зданию успешно получена.", Type = typeof(BuildingSummaryDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Здание с указанным ID не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<BuildingSummaryDto>> GetBuildingSummary(
            [SwaggerParameter(Description = "Уникальный идентификатор здания", Required = true)] int id)
        {
            var building = await _context.Buildings
                .Include(b => b.Rooms)
                .ThenInclude(room => room.Resettlements)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (building == null)
                return NotFound(new ApiErrorDto("Здание не найдено", StatusCodes.Status404NotFound));

            var totalCapacity = building.Rooms.Sum(room => room.Capacity);
            var totalFloors = building.Rooms
                .Select(room => room.Floor)
                .Distinct()
                .Count();
            var occupiedCount = building.Rooms
                .Sum(room => room.Resettlements.Count(resettlement =>
                    resettlement.CheckInDate.HasValue && !resettlement.CheckOutDate.HasValue));

            return Ok(new BuildingSummaryDto
            {
                TotalCapacity = totalCapacity,
                TotalFloors = totalFloors,
                OccupiedCount = occupiedCount,
            });
        }

        [HttpPost]
        [SwaggerOperation(
            Summary = "Создание нового здания",
            Description = "Регистрирует новое здание с указанием адреса и координат.")]
        [SwaggerResponse(StatusCodes.Status201Created, "Здание успешно создано.", Type = typeof(BuildingDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка при валидации.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<BuildingDto>> PostGroup(
            [SwaggerRequestBody("Данные о новом здании", Required = true)] PostBuildingDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var building = new Building
            {
                Name = dto.Name,
                Address = dto.Address,
                Latitude = dto.Coordinates.Latitude,
                Longitude = dto.Coordinates.Longitude
            };

            _context.Buildings.Add(building);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBuilding), new { id = building.Id }, building.ToDto());
        }

        [HttpPut("{id}")]
        [SwaggerOperation(Summary = "Обновление данных здания", Description = "Позволяет обновить данные о здании.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Данные здания успешно обновлены.", Type = typeof(BuildingDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Некорректные данные запроса.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Здание не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<Building>> PutBuilding([SwaggerParameter("ID здания", Required = true)] int id, [FromBody] BuildingDto updateDto)
        {
            if (id <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор", StatusCodes.Status400BadRequest));

            if (updateDto.Id != 0 && updateDto.Id != id)
                return BadRequest(new ApiErrorDto("ID здания в теле запроса не совпадает с путевым параметром", StatusCodes.Status400BadRequest));

            var building = await _context.Buildings
                .FirstOrDefaultAsync(s => s.Id == id);

            if (building == null)
                return NotFound(new ApiErrorDto("Здание не найдено", StatusCodes.Status404NotFound));

            building.Name = updateDto.Name;
            building.Address = updateDto.Address;
            building.Latitude = updateDto.Coordinates.Latitude;
            building.Longitude = updateDto.Coordinates.Longitude;

            await _context.SaveChangesAsync();

            await _context.Entry(building).Collection(s => s.Rooms).LoadAsync();

            return Ok(building.ToDto());
        }

        [HttpDelete("{id}")]
        [SwaggerOperation(
            Summary = "Удаление здания",
            Description = "Удаляет здание по его ID.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Здание успешно удалено.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Здание не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> DeleteBuilding(
            [SwaggerParameter(Description = "Уникальный идентификатор здания", Required = true)] int id)
        {
            var building = await _context.Buildings
                 .FirstOrDefaultAsync(u => u.Id == id);

            if (building == null)
                return NotFound(new ApiErrorDto("Здание не найдено", StatusCodes.Status404NotFound));

            _context.Buildings.Remove(building);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/statistic")]
        [SwaggerOperation(
           Summary = "Получение статистики по структуре общежития",
           Description = "Возвращает сводную статистику по зданию: общее количество мест, количество занятых и свободных мест, а также число заселенных студентов")]
        [SwaggerResponse(StatusCodes.Status200OK, "Статистика успешно получена.", Type = typeof(StructureStatisticDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Здание не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StructureStatisticDto>> GetStructureStatistic(
            [SwaggerParameter(Description = "Идентификатор здания", Required = true)] int id)
        {
            var buildingExists = await _context.Buildings.AnyAsync(b => b.Id == id);
            if (!buildingExists)
            {
                return NotFound(new ApiErrorDto("Здание не найдено", StatusCodes.Status404NotFound));
            }

            var totalCapacity = await _context.Rooms
                .Where(r => r.BuildingId == id)
                .Select(r => (int?)r.Capacity)
                .SumAsync() ?? 0;

            var activeResettlements = _context.Resettlements
                .Where(r => r.CheckInDate.HasValue && !r.CheckOutDate.HasValue)
                .Where(r => r.Room != null && r.Room.BuildingId == id);

            var occupiedCount = await activeResettlements.CountAsync();

            var freeCount = totalCapacity - occupiedCount;

            var studentCount = await _context.Students.CountAsync();

            var statistic = new StructureStatisticDto
            {
                TotalCopacity = totalCapacity,
                OccupiedCount = occupiedCount,
                FreeCount = freeCount,
                StudentCount = studentCount
            };

            return Ok(statistic);
        }

        [HttpGet("statistic")]
        [SwaggerOperation(
           Summary = "Получение общей статистики по общежитиям",
           Description = "Возвращает сводную статистику: количество зданий, студентов, мест и заселенных студентов.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Общая статистика успешно получена.", Type = typeof(OverallStructureStatisticDto))]
        public async Task<ActionResult<OverallStructureStatisticDto>> GetOverallStructureStatistic()
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
        #endregion

        #region Комнаты
        [HttpGet("{id}/rooms")]
        [SwaggerOperation(
            Summary = "Получение списка всех комнат здания",
            Description = "Возвращает полный список комнат указанного здания с информацией о вместимости, текущем заселении и поле проживающих.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список комнат успешно получен.", Type = typeof(IEnumerable<RoomDto>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Комнаты не найдены.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<IEnumerable<RoomDto>>> GetAllRooms(int id)
        {
            var rooms = await _context.Rooms
                .Where(predicate => predicate.BuildingId == id)
                .Include(r => r.Resettlements)
                .ThenInclude(resettlement => resettlement.Student)
                .ToListAsync();

            return Ok(rooms.Select(r => r.ToDto()));
        }
        #endregion
    }
}
