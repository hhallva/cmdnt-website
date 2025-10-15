using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.User;
using DataLayer.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Swashbuckle.AspNetCore.Annotations;

namespace CmdntApi.Controllers
{
    [SwaggerTag("Управление пользователями системы")]
    [Route("api/v1/[controller]")]
    [ApiController]
    public class UsersController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet("statistic")]
        public async Task<ActionResult<IEnumerable<UserStatisticDto>>> GetStatistic()
        {
            var totalUsers = await _context.Users.CountAsync();

            var adminCount = await _context.Users
                .Include(u => u.Role)
                .CountAsync(u => u.Role.Name == "Администратор");

            var commandantCount = await _context.Users
                .Include(u => u.Role)
                .CountAsync(u => u.Role.Name == "Комендант");

            var educatorCount = await _context.Users
                .Include(u => u.Role)
                .CountAsync(u => u.Role.Name == "Воспитатель");

            var statistic = new UserStatisticDto
            {
                TotalUsers = totalUsers,
                AdminCount = adminCount,
                CommandantCount = commandantCount,
                EducatorCount = educatorCount
            };

            return Ok(statistic);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Surname = u.Surname,
                    Patronymic = u.Patronymic,
                    Login = u.Login,
                    HashPassword = u.HashPassword,
                    RoleId = u.RoleId
                }).ToListAsync();

            if (users.Count == 0)
                return NotFound(new ApiErrorDto("Пользователи не найдены", StatusCodes.Status404NotFound));
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound(new ApiErrorDto("Пользователь не найдены", StatusCodes.Status404NotFound));

            var response = new UserDto
            {
                Id = user.Id,
                RoleId = user.RoleId,
                Name = user.Name,
                Surname = user.Surname,
                Patronymic = user.Patronymic,
                Login = user.Login,
                HashPassword = user.HashPassword
            };

            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, PutUserDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound(new ApiErrorDto("Пользователь не найден", StatusCodes.Status404NotFound));

            user.RoleId = dto.RoleId;
            user.Surname = dto.Surname;
            user.Name = dto.Name;
            user.Patronymic = dto.Patronymic;
            user.Login = dto.Login;

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

        [HttpPatch("{id}")]
        public async Task<IActionResult> PatchPassword(int id, UpdatePasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound(new ApiErrorDto("Пользователь не найден", StatusCodes.Status404NotFound));

            user.HashPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

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
        public async Task<ActionResult<UserDto>> PostUser(PostUserDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiErrorDto("Неправильно передан объект", StatusCodes.Status400BadRequest));

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Login == dto.Login);
            if (existingUser != null)
                return BadRequest(new ApiErrorDto("Пользователь с таким логином уже существует", StatusCodes.Status400BadRequest));

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                Surname = dto.Surname,
                Name = dto.Name,
                Patronymic = dto.Patronymic,
                Login = dto.Login,
                HashPassword = passwordHash,
                RoleId = dto.RoleId,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var userDto = new UserDto
            {
                Id = user.Id,
                RoleId = user.RoleId,
                Surname = user.Surname,
                Name = user.Name,
                Patronymic = user.Patronymic,
                Login = user.Login,
                HashPassword = user.HashPassword 
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userDto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                 .Include(u => u.Notes)
                 .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new ApiErrorDto("Пользователь не найден", StatusCodes.Status404NotFound));

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
