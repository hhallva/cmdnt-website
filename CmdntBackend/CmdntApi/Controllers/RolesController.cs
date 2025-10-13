using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmdntApi.Controllers
{
   
    [Route("api/[controller]")]
    [ApiController]
    public class RolesController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name,
                }).ToListAsync();
         
            if(!roles.Any())
                return NotFound("Роли не найдены!");
            return Ok(roles);
        }
    }
}
