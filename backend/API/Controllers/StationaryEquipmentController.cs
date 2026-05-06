using Core.Data;
using Core.DTOs;
using Core.DTOs.StationaryEquipment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [SwaggerTag("Управление стационарным оборудованием")]
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class StationaryEquipmentController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpPost("{id}/room/{roomId}")]
        [SwaggerOperation(
            Summary = "Назначение комнаты",
            Description = "Закрепляет оборудование за выбранной комнатой.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Оборудование успешно закреплено.", Type = typeof(StationaryEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Некорректные параметры.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Оборудование или комната не найдены.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StationaryEquipmentDto>> AssignRoom(
            [SwaggerParameter("ID оборудования", Required = true)] int id,
            [SwaggerParameter("ID комнаты", Required = true)] int roomId)
        {
            if (id <= 0 || roomId <= 0)
                return BadRequest(new ApiErrorDto("Некорректные параметры", StatusCodes.Status400BadRequest));

            var equipment = await _context.StationaryEquipments
                .Include(item => item.Type)
                .Include(item => item.Status)
                .Include(item => item.Room)
                .ThenInclude(room => room!.Building)
                .FirstOrDefaultAsync(item => item.Id == id);

            if (equipment == null)
                return NotFound(new ApiErrorDto("Оборудование не найдено", StatusCodes.Status404NotFound));

            var room = await _context.Rooms
                .Include(item => item.Building)
                .FirstOrDefaultAsync(item => item.Id == roomId);

            if (room == null)
                return NotFound(new ApiErrorDto("Комната не найдена", StatusCodes.Status404NotFound));

            equipment.RoomId = roomId;
            equipment.Room = room;

            await _context.SaveChangesAsync();

            var updated = await _context.StationaryEquipments
                .AsNoTracking()
                .Include(item => item.Type)
                .Include(item => item.Status)
                .Include(item => item.Room)
                    .ThenInclude(room => room!.Building)
                .FirstAsync(item => item.Id == equipment.Id);

            return Ok(updated.ToDto());
        }

        [HttpDelete("{id}/room/{roomId}")]
        [SwaggerOperation(
            Summary = "Снятие с комнаты",
            Description = "Удаляет привязку оборудования к указанной комнате (возвращает на склад).")]
        [SwaggerResponse(StatusCodes.Status200OK, "Оборудование успешно снято.", Type = typeof(StationaryEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Некорректные параметры.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Оборудование не найдено или не привязано к указанной комнате.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StationaryEquipmentDto>> EvictRoom(
            [SwaggerParameter("ID оборудования", Required = true)] int id,
            [SwaggerParameter("ID комнаты", Required = true)] int roomId)
        {
            if (id <= 0 || roomId <= 0)
                return BadRequest(new ApiErrorDto("Некорректные параметры", StatusCodes.Status400BadRequest));

            var equipment = await _context.StationaryEquipments
                .Include(item => item.Type)
                .Include(item => item.Status)
                .Include(item => item.Room)
                .ThenInclude(room => room!.Building)
                .FirstOrDefaultAsync(item => item.Id == id);

            if (equipment == null)
                return NotFound(new ApiErrorDto("Оборудование не найдено", StatusCodes.Status404NotFound));

            if (equipment.RoomId != roomId)
                return NotFound(new ApiErrorDto("Оборудование не привязано к указанной комнате", StatusCodes.Status404NotFound));

            equipment.RoomId = null;
            equipment.Room = null;

            await _context.SaveChangesAsync();

            return Ok(equipment.ToDto());
        }

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение списка оборудования",
            Description = "Возвращает список стационарного оборудования с типом, статусом и размещением.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список оборудования успешно получен.", Type = typeof(IEnumerable<StationaryEquipmentDto>))]
        public async Task<ActionResult<IEnumerable<StationaryEquipmentDto>>> GetStationaryEquipment()
        {
            var equipment = await _context.StationaryEquipments
                .AsNoTracking()
                .Include(item => item.Type)
                .Include(item => item.Status)
                .Include(item => item.Room)
                .ThenInclude(room => room!.Building)
                .ToListAsync();

            return Ok(equipment.Select(item => item.ToDto()));
        }

        [HttpGet("{id}")]
        [SwaggerOperation(
            Summary = "Получение оборудования по ID",
            Description = "Возвращает стационарное оборудование по его идентификатору.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Оборудование успешно найдено.", Type = typeof(StationaryEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Оборудование не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StationaryEquipmentDto>> GetStationaryEquipmentById(
            [SwaggerParameter(Description = "Уникальный идентификатор оборудования", Required = true)] int id)
        {
            var equipment = await _context.StationaryEquipments
                .AsNoTracking()
                .Include(item => item.Type)
                .Include(item => item.Status)
                .Include(item => item.Room)
                .ThenInclude(room => room!.Building)
                .FirstOrDefaultAsync(item => item.Id == id);

            if (equipment == null)
                return NotFound(new ApiErrorDto("Оборудование не найдено", StatusCodes.Status404NotFound));

            return Ok(equipment.ToDto());
        }

        [HttpPost]
        [SwaggerOperation(
            Summary = "Создание оборудования",
            Description = "Добавляет новое стационарное оборудование.")]
        [SwaggerResponse(StatusCodes.Status201Created, "Оборудование успешно создано.", Type = typeof(StationaryEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StationaryEquipmentDto>> PostStationaryEquipment(
            [SwaggerRequestBody("Данные нового оборудования", Required = true)] PostStationaryEquipmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var normalizedInventory = dto.InventoryNumber.Trim().ToUpperInvariant();
            var existsInventory = await _context.StationaryEquipments
                .AnyAsync(item => item.InventoryNumber == normalizedInventory);

            if (existsInventory)
                return BadRequest(new ApiErrorDto("Инвентарный номер уже существует", StatusCodes.Status400BadRequest));

            var typeExists = await _context.StationaryTypes
                .AnyAsync(item => item.Id == dto.TypeId);
            if (!typeExists)
                return BadRequest(new ApiErrorDto("Категория не найдена", StatusCodes.Status400BadRequest));

            var statusExists = await _context.Statuses
                .AnyAsync(item => item.Id == dto.StatusId);
            if (!statusExists)
                return BadRequest(new ApiErrorDto("Статус не найден", StatusCodes.Status400BadRequest));

            var equipment = new Core.Models.StationaryEquipment
            {
                InventoryNumber = normalizedInventory,
                TypeId = dto.TypeId,
                StatusId = dto.StatusId,
                Description = dto.Description?.Trim(),
                RoomId = null,
            };

            _context.StationaryEquipments.Add(equipment);
            await _context.SaveChangesAsync();

            var created = await _context.StationaryEquipments
                .AsNoTracking()
                .Include(item => item.Type)
                .Include(item => item.Status)
                .Include(item => item.Room)
                .ThenInclude(room => room!.Building)
                .FirstAsync(item => item.Id == equipment.Id);

            return CreatedAtAction(nameof(GetStationaryEquipmentById), new { id = created.Id }, created.ToDto());
        }

        [HttpPut("{id}")]
        [SwaggerOperation(
            Summary = "Обновление оборудования",
            Description = "Обновляет данные стационарного оборудования.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Оборудование успешно обновлено.", Type = typeof(StationaryEquipmentDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Оборудование не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StationaryEquipmentDto>> PutStationaryEquipment(
            [SwaggerParameter("ID оборудования", Required = true)] int id,
            [FromBody] UpdateStationaryEquipmentDto dto)
        {
            if (id <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор", StatusCodes.Status400BadRequest));

            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var equipment = await _context.StationaryEquipments
                .Include(item => item.Type)
                .Include(item => item.Status)
                .Include(item => item.Room)
                .ThenInclude(room => room!.Building)
                .FirstOrDefaultAsync(item => item.Id == id);

            if (equipment == null)
                return NotFound(new ApiErrorDto("Оборудование не найдено", StatusCodes.Status404NotFound));

            var normalizedInventory = dto.InventoryNumber.Trim().ToUpperInvariant();
            var existsInventory = await _context.StationaryEquipments
                .AnyAsync(item => item.Id != id && item.InventoryNumber == normalizedInventory);

            if (existsInventory)
                return BadRequest(new ApiErrorDto("Инвентарный номер уже существует", StatusCodes.Status400BadRequest));

            var typeExists = await _context.StationaryTypes
                .AnyAsync(item => item.Id == dto.TypeId);
            if (!typeExists)
                return BadRequest(new ApiErrorDto("Категория не найдена", StatusCodes.Status400BadRequest));

            var statusExists = await _context.Statuses
                .AnyAsync(item => item.Id == dto.StatusId);
            if (!statusExists)
                return BadRequest(new ApiErrorDto("Статус не найден", StatusCodes.Status400BadRequest));

            equipment.InventoryNumber = normalizedInventory;
            equipment.TypeId = dto.TypeId;
            equipment.StatusId = dto.StatusId;
            equipment.Description = dto.Description?.Trim();

            await _context.SaveChangesAsync();

            return Ok(equipment.ToDto());
        }

        [HttpDelete("{id}")]
        [SwaggerOperation(
            Summary = "Удаление оборудования",
            Description = "Удаляет стационарное оборудование по его ID.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Оборудование успешно удалено.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Оборудование не найдено.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> DeleteStationaryEquipment(
            [SwaggerParameter(Description = "Уникальный идентификатор оборудования", Required = true)] int id)
        {
            var equipment = await _context.StationaryEquipments
                .FirstOrDefaultAsync(item => item.Id == id);

            if (equipment == null)
                return NotFound(new ApiErrorDto("Оборудование не найдено", StatusCodes.Status404NotFound));

            _context.StationaryEquipments.Remove(equipment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("statistic")]
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
