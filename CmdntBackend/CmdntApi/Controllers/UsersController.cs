using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.User;
using DataLayer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace CmdntApi.Controllers
{
    [SwaggerTag("Управление пользователями системы")]
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        [HttpGet("statistic")]
        [SwaggerOperation(
            Summary = "Получение статистики по пользователям",
            Description = "Возвращает сводную статистику: общее количество пользователей, а также количество администраторов, комендантов и воспитателей.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Статистика успешно получена.", Type = typeof(UserStatisticDto))]
        public async Task<ActionResult<UserStatisticDto>> GetStatistic()
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
        [SwaggerOperation(
            Summary = "Получение списка всех пользователей",
            Description = "Возвращает полный список пользователей системы.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Список пользователей успешно получен.", Type = typeof(IEnumerable<UserDto>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Пользователи не найдены.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Surname = u.Surname,
                    Patronymic = u.Patronymic,
                    Login = u.Login,
                    Role = new RoleDto
                    {
                        Id = u.Role.Id,
                        Name = u.Role.Name
                    }
                }).ToListAsync();

            if (users.Count == 0)
                return NotFound(new ApiErrorDto("Пользователи не найдены", StatusCodes.Status404NotFound));
            return Ok(users);
        }

        [HttpGet("{id}")]
        [SwaggerOperation(
            Summary = "Получение пользователя по ID",
            Description = "Возвращает данные пользователя по его уникальному идентификатору.")]
        [SwaggerResponse(StatusCodes.Status200OK, "Пользователь успешно найден.", Type = typeof(UserDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Пользователь с указанным ID не найден.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<UserDto>> GetUser(
            [SwaggerParameter(Description = "Уникальный идентификатор пользователя")] int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new ApiErrorDto("Пользователь не найден", StatusCodes.Status404NotFound));

            var response = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Patronymic = user.Patronymic,
                Login = user.Login,
                Role = new RoleDto
                {
                    Id = user.Role.Id,
                    Name = user.Role.Name
                }
            };

            return Ok(response);
        }

        [HttpPut("{id}")]
        [SwaggerOperation(
            Summary = "Обновление данных пользователя",
            Description = "Полное обновление данных пользователя (кроме пароля) по его ID.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Данные пользователя успешно обновлены.")]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Некорректные данные в запросе.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Пользователь не найден.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status409Conflict, "Конфликт параллельного редактирования.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> PutUser(
            [SwaggerParameter(Description = "Уникальный идентификатор пользователя", Required = true)] int id,
            [SwaggerRequestBody("Данные для обновления пользователя", Required = true)] PutUserDto dto)
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
        [SwaggerOperation(
            Summary = "Изменение пароля пользователя",
            Description = "Обновляет хэш пароля пользователя по его ID.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Пароль успешно изменён.")]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Некорректные данные.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Пользователь не найден.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status409Conflict, "Конфликт параллельного редактирования.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> PatchPassword(
            [SwaggerParameter(Description = "Уникальный идентификатор пользователя", Required = true)] int id,
            [SwaggerRequestBody("Новый пароль пользователя", Required = true)] UpdatePasswordDto dto)
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
        [SwaggerOperation(
            Summary = "Создание нового пользователя",
            Description = "Регистрирует нового пользователя в системе с указанием логина, пароля и роли.")]
        [SwaggerResponse(StatusCodes.Status201Created, "Пользователь успешно создан.", Type = typeof(UserDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Ошибка валидации или логин уже занят.", Type = typeof(ApiErrorDto))]
        public async Task<ActionResult<UserDto>> PostUser(
            [SwaggerRequestBody("Данные нового пользователя", Required = true)] PostUserDto dto)
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

            var dbUser = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == user.Id);

            var userDto = new UserDto
            {
                Id = dbUser.Id,
                Surname = dbUser.Surname,
                Name = dbUser.Name,
                Patronymic = dbUser.Patronymic,
                Login = dbUser.Login,
                Role = new RoleDto
                {
                    Id = dbUser.Role.Id,
                    Name = dbUser.Role.Name
                }
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userDto);
        }

        [HttpDelete("{id}")]
        [SwaggerOperation(
            Summary = "Удаление пользователя",
            Description = "Удаляет пользователя из системы. При этом обнуляется ссылка UserId во всех связанных заметках (Note), чтобы сохранить целостность базы данных.")]
        [SwaggerResponse(StatusCodes.Status204NoContent, "Пользователь успешно удалён.")]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Пользователь не найден.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> DeleteUser(
            [SwaggerParameter("id", Description = "Уникальный идентификатор пользователя")] int id)
        {
            var user = await _context.Users
                 .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new ApiErrorDto("Пользователь не найден", StatusCodes.Status404NotFound));

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
