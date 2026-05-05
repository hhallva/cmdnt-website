using Core.Data;
using Core.DTOs;
using Core.DTOs.Statuses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers
{
    [SwaggerTag("Справочник статусов стационарного оборудования")]
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class StatusesController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        [SwaggerOperation(
            Summary = "Получение списка статусов",
            Description = "Возвращает полный список статусов стационарного оборудования.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список статусов успешно получен.", Type = typeof(IEnumerable<StatusDto>))]
        public async Task<ActionResult<IEnumerable<StatusDto>>> GetAllStatuses()
        {
            var statuses = await _context.Statuses
                .AsNoTracking()
                .ToListAsync();

            return Ok(statuses.Select(status => status.ToDto()));
        }
    }
}
