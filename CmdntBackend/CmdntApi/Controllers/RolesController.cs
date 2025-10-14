using DataLayer.Data;
using DataLayer.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace CmdntApi.Controllers
{

    [SwaggerTag("Управление ролями пользователей")]
    [Route("api/v1/[controller]")]
    [ApiController]
    public class RolesController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получить все роли",
            Description = "Метод возвращает список всех доступных ролей пользователей в системе.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список ролей успешно возвращен.", Type = typeof(List<RoleDto>))] // Уточнён тип
        [SwaggerResponse(StatusCodes.Status404NotFound, "Роли не найдены. Возврат сообщения об ошибке.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status500InternalServerError, "Внутренняя ошибка сервера.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name,
                }).ToListAsync();

            if (roles.Count == 0)
                return NotFound(new ApiErrorDto("Роли не найдены", StatusCodes.Status404NotFound));
            return Ok(roles);
        }
    }
}
