using Core.Data;
using Core.DTOs;
using Core.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using DotNetEnv;
using Core.Models;
using Microsoft.AspNetCore.Identity;
using System.Runtime.CompilerServices;
using NuGet.Protocol;

if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
    Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

var dbHost = builder.Configuration["DB_HOST"]
    ?? throw new InvalidOperationException("DB_HOST не установлен в .env");
var dbPort = builder.Configuration["DB_PORT"]
    ?? throw new InvalidOperationException("DB_PORT не установлен в .env");
var dbName = builder.Configuration["DB_NAME"]
    ?? throw new InvalidOperationException("DB_NAME не установлен в .env");
var dbUser = builder.Configuration["DB_USER"]
    ?? throw new InvalidOperationException("DB_USER не установлен в .env");
var dbPassword = builder.Configuration["DB_PASSWORD"]
    ?? throw new InvalidOperationException("DB_PASSWORD не установлен в .env");
var jwtKey = builder.Configuration["JWT_KEY"]
    ?? throw new InvalidOperationException("JWT_KEY не установлен в .env");
var corsOrigins = builder.Configuration["CORS_ORIGINS"]
    ?? throw new InvalidOperationException("CORS_ORIGINS не установлен в .env");

var connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPassword};";

builder.Services.AddResponseCompression();
builder.Services.AddScoped<TokenService, TokenService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
        options.TokenValidationParameters = new()
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        }
    );

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(connectionString));

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
        options.SuppressMapClientErrors = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opt =>
{
    opt.EnableAnnotations();
    opt.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Введите токен авторизации",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "bearer"
    });
    opt.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
    {
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type=ReferenceType.SecurityScheme,
                Id="Bearer"
            }
        },
        Array.Empty<string>()
    }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();

    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    await SeedAdminUserAsync(scope.ServiceProvider, configuration);
    await SeedExpendableTypesAsync(scope.ServiceProvider);
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var exceptionHandler = context.Features.Get<IExceptionHandlerFeature>();
        var logger = app.Services.GetRequiredService<ILogger<Program>>();

        logger.LogError(
            exceptionHandler?.Error,
            "Произошло необработанное исключение по пути: {Path}.",
            exceptionHandler?.Path
        );

        await context.Response.WriteAsJsonAsync(new ApiErrorDto("Что-то пошло не так...", 500));
    });
});

app.Run();


static async Task SeedAdminUserAsync(IServiceProvider serviceProvider, IConfiguration configuration)
{
    using var scope = serviceProvider.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    // Читаем настройки из переменных окружения
    var login = configuration["ADMIN_SEED_EMAIL"] ?? "admin";
    var adminPassword = configuration["ADMIN_SEED_PASSWORD"] ?? "admin";

    var adminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "Администратор");
    var cmdntRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "Комендант");
    var vospitRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "Воспитатель");

    if (adminRole == null)
    {
        adminRole = new Role { Name = "Администратор" };
        dbContext.Roles.Add(adminRole);
        await dbContext.SaveChangesAsync();
    }

    if (cmdntRole == null)
    {
        cmdntRole = new Role { Name = "Комендант" };
        dbContext.Roles.Add(cmdntRole);
        await dbContext.SaveChangesAsync();
    }

    if (vospitRole == null)
    {
        vospitRole = new Role { Name = "Воспитатель" };
        dbContext.Roles.Add(vospitRole);
        await dbContext.SaveChangesAsync();
    }

    Role role = await dbContext.Roles.FirstAsync(r => r.Name == "Администратор");

    // Проверяем, существует ли пользователь с таким email
    var existingAdmin = await dbContext.Users
        .Include(u => u.Role)
        .FirstOrDefaultAsync(u => u.Login == login);

    if (existingAdmin != null)
    {
        if (existingAdmin.Role.Name != "Администратор")
        {
            existingAdmin.Role = role;
            await dbContext.SaveChangesAsync();
        }
        return;
    }

    // Создаём нового пользователя
    var adminUser = new User
    {
        Login = login,
        HashPassword = passwordHasher.HashPassword(adminPassword),
        Role = role,
        Name = "Админ",
        Surname = "Админов",
        Patronymic = "Админович",
    };

    dbContext.Users.Add(adminUser);
    await dbContext.SaveChangesAsync();
}

static async Task SeedExpendableTypesAsync(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Список уникальных названий постельного белья
    var expendableTypeNames = new[]
    {
        "Матрас",
        "Простынь",
        "Одеяло",
        "Пододеяльник",
        "Подушка",
        "Наволочка"
    };

    foreach (var name in expendableTypeNames)
    {
        var exists = await dbContext.ExpendableTypes.AnyAsync(e => e.Name == name);
        if (!exists)
            dbContext.ExpendableTypes.Add(new ExpendableType { Name = name });
    }

    await dbContext.SaveChangesAsync();
}