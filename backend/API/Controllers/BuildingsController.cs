using Core.Data;
using Core.DTOs;
using Core.DTOs.Buildings;
using Core.DTOs.Rooms;
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
