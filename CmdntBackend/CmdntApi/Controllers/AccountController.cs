using System.Runtime.CompilerServices;
using DataLayer.Data;
using DataLayer.DTOs;
using DataLayer.DTOs.Account;
using DataLayer.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;


namespace CmdntApi.Controllers
{
    [SwaggerTag("Управление авторизацией пользователя")]
    [Route("api/v1/")]
    [ApiController]
    public class AccountController(TokenService service, AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;
        private readonly TokenService _service = service;

        [HttpPost("SignIn")]
        [SwaggerOperation(
            Summary = "Авторизация пользователя",
            Description = "Метод для генерации JWT-токена, принимает учетные данные пользователя, при успешной авторизации возвращает объекта с JWT-токеном.")]
        [SwaggerResponse(StatusCodes.Status201Created, "Успешная авторизация. Возврат объекта с JWT-токеном.", Type = typeof(LoginResponseDto))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "Пользователь не найден. Возврат сообщения об ошибке.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "Неверные параметры. Возврат сообщения об ошибке.", Type = typeof(ApiErrorDto))]
        [SwaggerResponse(StatusCodes.Status403Forbidden, "Доступ запрещен. Возврат сообщения об ошибке.", Type = typeof(ApiErrorDto))]
        public async Task<IActionResult> Login(
            [SwaggerRequestBody("Учетные данные пользователя", Required = true)][FromBody] LoginDto user)
        {
            var dbUser = await _context.Users
                            .Include(u => u.Role).AsNoTracking().FirstOrDefaultAsync(u => u.Login == user.Login);

            if (dbUser == null)
                return StatusCode(StatusCodes.Status403Forbidden, new ApiErrorDto("Доступ запрещён", StatusCodes.Status403Forbidden));

            bool idPasswordValid = BCrypt.Net.BCrypt.Verify(user.Password, dbUser.HashPassword);

            if (!idPasswordValid)
                return StatusCode(StatusCodes.Status403Forbidden, new ApiErrorDto("Доступ запрещён", StatusCodes.Status403Forbidden));

            var token = _service.GenerateToken(dbUser);

            var response = new LoginResponseDto()
            {
                Id = dbUser.Id,
                Name = dbUser.Name,
                Surname = dbUser.Surname,
                Patronymic = dbUser.Patronymic,
                role = new RoleDto
                {
                    Id = dbUser.Role.Id,
                    Name = dbUser.Role.Name
                },
                Login = dbUser.Login,
                Token = token
            };

            return StatusCode(StatusCodes.Status201Created, response);
        }
    }
}