using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.Room;
using DataLayer.DTOs.User;
using DataLayer.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace CmdntApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение списка всех комнат",
            Description = "Возвращает полный список комнат общежития с информацией о вместимости, текущем заселении и поле проживающих.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список комнат успешно получен.", Type = typeof(IEnumerable<RoomDto>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Комнаты не найдены.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<IEnumerable<RoomDto>>> GetAllRooms()
        {
            var rooms = await _context.Rooms
                .Include(r => r.Students)
                .Select(r => new RoomDto
                {
                    Id = r.Id,
                    RoomNumber = (r.FloorNumber * 100 + r.RoomNumber).ToString(),
                    Capacity = r.Capacity,
                    CurrentCapacity = r.Students.Count,
                    GenderType = r.Students.Count == 0 ? null : r.Students.First().Gender
                }).ToListAsync();

            if (rooms.Count == 0)
                return NotFound(new ApiErrorDto("Комнаты не найдены", StatusCodes.Status404NotFound));
            return Ok(rooms);
        }

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
                .Include(r => r.Students)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null)
                return NotFound(new ApiErrorDto("Комната не найдена", StatusCodes.Status404NotFound));

            var response = new RoomDto
            {
                Id = room.Id,
                RoomNumber = (room.FloorNumber * 100 + room.RoomNumber).ToString(),
                Capacity = room.Capacity,
                CurrentCapacity = room.Students.Count,
                GenderType = room.Students.Count == 0 ? null : room.Students.First().Gender
            };

            return Ok(response);
        }

        [HttpPatch("{id}")]
        [SwaggerOperation(
            Summary = "Обновление вместимости комнаты",
            Description = "Изменяет максимальную вместимость комнаты (поле Capacity).")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Вместимость успешно обновлена.")]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Некорректные данные в запросе.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Комната не найдена.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status409Conflict, "Конфликт параллельного редактирования.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> PatchPassword(
            [SwaggerParameter(Description = "Уникальный идентификатор комнаты", Required = true)] int id,
            [SwaggerRequestBody("Новое значение вместимости", Required = true)] UpdateCapacityDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var room = await _context.Rooms.FindAsync(id);

            if (room == null)
                return NotFound(new ApiErrorDto("Комната не найдена", StatusCodes.Status404NotFound));

            room.Capacity = dto.Capacity;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(StatusCodes.Status409Conflict, new ApiErrorDto("Конфликт параллельного редактирования", StatusCodes.Status409Conflict));
            }

            return NoContent();
        }

        [HttpPost]
        [SwaggerOperation(
            Summary = "Создание новой комнаты",
            Description = "Регистрирует новую комнату в общежитии с указанием этажа, номера и вместимости.")]
        [SwaggerResponse(StatusCodes.Status201Created, "Комната успешно создана.", Type = typeof(RoomDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<Room>> PostRoom(
            [SwaggerRequestBody("Данные новой комнаты", Required = true)] PostRoomDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var room = new Room
            {
                FloorNumber = dto.FloorNumber,
                RoomNumber = dto.RoomNumber,
                Capacity = dto.Capacity,
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            var roomDto = new RoomDto
            {
                Id = room.Id,
                RoomNumber = (room.FloorNumber * 100 + room.RoomNumber).ToString(),
                Capacity = room.Capacity,
                CurrentCapacity = room.Students.Count,
                GenderType = room.Students.Count == 0 ? null : room.Students.First().Gender
            };

            return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, roomDto);
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
                  .Include(g => g.Students)
                  .FirstOrDefaultAsync(u => u.Id == id);

            if (room == null)
                return NotFound(new ApiErrorDto("Комната не найдена", StatusCodes.Status404NotFound));

            room.Students.Clear();

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return NoContent();
        }       
    }
}