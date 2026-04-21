using Core.Data;
using Core.DTOs;
using Core.DTOs.Rooms;
using Core.DTOs.Students;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class RoomsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet("{id}")]
        [SwaggerOperation(
            Summary = "Получение информации о комнате по ID",
            Description = "Возвращает данные о конкретной комнате, включая номер (этаж + номер), вместимость, текущее заселение и пол проживающих.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Комната успешно найдена.", Type = typeof(RoomDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Комната с указанным ID не найдена.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<RoomDto>> GetRoom(
            [SwaggerParameter(Description = "Уникальный идентификатор комнаты", Required = true)] int id)
        {
            var room = await _context.Rooms
                .Include(r => r.Resettlements)
                .ThenInclude(resettlement => resettlement.Student)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null)
                return NotFound(new ApiErrorDto("Комната не найдена", StatusCodes.Status404NotFound));

            return Ok(room.ToDto());
        }

        [HttpGet("{id}/students")]
        [SwaggerOperation(
            Summary = "Получение списка студентов по ID комнаты",
            Description = "Возвращает список студентов, заселённых в указанную комнату. Включает информацию о группе каждого студента.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список студентов успешно получен.", Type = typeof(IEnumerable<StudentDto>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Комната с указанным ID не найдена.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<List<StudentDto>>> GetStudentsByRoomId(
            [SwaggerParameter(Description = "Уникальный идентификатор комнаты", Required = true)] int id)
        {
            var room = await _context.Rooms
                .Include(r => r.Resettlements)
                    .ThenInclude(resettlement => resettlement.Student)
                        .ThenInclude(student => student.Group)
                .Include(r => r.Resettlements)
                    .ThenInclude(resettlement => resettlement.Student)
                        .ThenInclude(student => student.Resettlements)
                            .ThenInclude(resettlement => resettlement.Room)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null)
                return NotFound(new ApiErrorDto("Комната не найдена", StatusCodes.Status404NotFound));

            var activeStudents = room.Resettlements
                .Where(resettlement => resettlement.CheckInDate.HasValue && !resettlement.CheckOutDate.HasValue)
                .Select(resettlement => resettlement.Student)
                .ToList();

            return Ok(activeStudents.Select(s => s.ToDto()));
        }

        [HttpPost]
        [SwaggerOperation(
            Summary = "Создание новой комнаты",
            Description = "Регистрирует новую комнату в общежитии с указанием здания, этажа, номера и вместимости.")]
        [SwaggerResponse(StatusCodes.Status201Created, "Комната успешно создана.", Type = typeof(RoomDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Здание не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<Room>> PostRoom(
            [SwaggerRequestBody("Данные новой комнаты", Required = true)] PostRoomDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var buildingExists = await _context.Buildings
                .AnyAsync(b => b.Id == dto.BuildingId);

            if (!buildingExists)
                return NotFound(new ApiErrorDto("Здание не найдено", StatusCodes.Status404NotFound));

            var room = new Room
            {
                BuildingId = dto.BuildingId,
                FloorNumber = dto.FloorNumber,
                RoomNumber = dto.RoomNumber,
                Capacity = dto.Capacity,
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            await _context.Rooms
                .Include(r => r.Resettlements)
                .ThenInclude(resettlement => resettlement.Student)
                .FirstOrDefaultAsync(r => r.Id == room.Id);


            return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, room.ToDto());
        }

        [HttpDelete("{id}")]
        [SwaggerOperation(
            Summary = "Удаление комнаты",
            Description = "Удаляет комнату из системы. Перед удалением все связанные студенты отвязываются от комнаты.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Комната успешно удалена.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Комната не найдена.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> DeleteRoom(
            [SwaggerParameter(Description = "Уникальный идентификатор комнаты", Required = true)] int id)
        {
            var room = await _context.Rooms
                .Include(r => r.Resettlements)
                  .FirstOrDefaultAsync(u => u.Id == id);

            if (room == null)
                return NotFound(new ApiErrorDto("Комната не найдена", StatusCodes.Status404NotFound));

            _context.Resettlements.RemoveRange(room.Resettlements);

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}