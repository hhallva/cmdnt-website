using Core.Data;
using Core.DTOs;
using Core.DTOs.StationaryTypes;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [SwaggerTag("Управление типами стационарного оборудования")]
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class StationaryController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        #region Типы
        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение списка всех типов",
            Description = "Возвращает полный список типов стационарного оборудования.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список типов успешно получен.", Type = typeof(IEnumerable<StationaryTypeDto>))]
        public async Task<ActionResult<IEnumerable<StationaryTypeDto>>> GetAllStationaryTypes()
        {
            var types = await _context.StationaryTypes
                .AsNoTracking()
                .ToListAsync();

            return Ok(types.Select(type => type.ToDto()));
        }

        [HttpGet("{id}")]
        [SwaggerOperation(
            Summary = "Получение типа по ID",
            Description = "Возвращает тип стационарного оборудования по его идентификатору.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Тип успешно найден.", Type = typeof(StationaryTypeDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Тип не найден.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StationaryTypeDto>> GetStationaryType(
            [SwaggerParameter(Description = "Уникальный идентификатор типа", Required = true)] int id)
        {
            var type = await _context.StationaryTypes
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == id);

            if (type == null)
                return NotFound(new ApiErrorDto("Тип не найден", StatusCodes.Status404NotFound));

            return Ok(type.ToDto());
        }

        [HttpPost]
        [SwaggerOperation(
            Summary = "Создание нового типа",
            Description = "Добавляет новый тип стационарного оборудования.")]
        [SwaggerResponse(StatusCodes.Status201Created, "Тип успешно создан.", Type = typeof(StationaryTypeDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации данных.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StationaryTypeDto>> PostStationaryType(
            [SwaggerRequestBody("Данные нового типа", Required = true)] PostStationaryTypeDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var type = new StationaryType
            {
                Name = dto.Name,
            };

            _context.StationaryTypes.Add(type);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStationaryType), new { id = type.Id }, type.ToDto());
        }

        [HttpPut("{id}")]
        [SwaggerOperation(
            Summary = "Обновление типа",
            Description = "Обновляет данные типа стационарного оборудования.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Тип успешно обновлен.", Type = typeof(StationaryTypeDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Некорректные данные запроса.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Тип не найден.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<StationaryTypeDto>> PutStationaryType(
            [SwaggerParameter("ID типа", Required = true)] int id,
            [FromBody] StationaryTypeDto updateDto)
        {
            if (id <= 0)
                return BadRequest(new ApiErrorDto("Некорректный идентификатор", StatusCodes.Status400BadRequest));

            if (updateDto.Id != 0 && updateDto.Id != id)
                return BadRequest(new ApiErrorDto("ID типа в теле запроса не совпадает с путевым параметром", StatusCodes.Status400BadRequest));

            var type = await _context.StationaryTypes
                .FirstOrDefaultAsync(item => item.Id == id);

            if (type == null)
                return NotFound(new ApiErrorDto("Тип не найден", StatusCodes.Status404NotFound));

            type.Name = updateDto.Name;

            await _context.SaveChangesAsync();

            return Ok(type.ToDto());
        }

        [HttpDelete("{id}")]
        [SwaggerOperation(
            Summary = "Удаление типа",
            Description = "Удаляет тип стационарного оборудования по его ID.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Тип успешно удален.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Тип не найден.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> DeleteStationaryType(
            [SwaggerParameter(Description = "Уникальный идентификатор типа", Required = true)] int id)
        {
            var type = await _context.StationaryTypes
                .FirstOrDefaultAsync(item => item.Id == id);

            if (type == null)
                return NotFound(new ApiErrorDto("Тип не найден", StatusCodes.Status404NotFound));

            _context.StationaryTypes.Remove(type);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        #endregion
    }
}
