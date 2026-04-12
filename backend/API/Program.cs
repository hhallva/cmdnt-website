using Core.Data;
using Core.DTOs;
using Core.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;
using Microsoft.OpenApi.Models;
using System.Text;

LoadDotEnvIfPresent();

var builder = WebApplication.CreateBuilder(args);

var config = builder.Configuration;

var connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"]
    ?? builder.Configuration["ConnectionStrings__DefaultConnection"]
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    var dbHost = builder.Configuration["DB_HOST"];
    if (string.IsNullOrWhiteSpace(dbHost))
    {
        dbHost = builder.Environment.IsDevelopment() ? "localhost" : "db";
    }

    var dbPort = builder.Configuration["DB_PORT"] ?? "3306";
    var dbName = builder.Configuration["DB_NAME"]   
        ?? throw new InvalidOperationException("DB_NAME is not set in configuration or .env");
    var dbUser = builder.Configuration["DB_USER"]
        ?? throw new InvalidOperationException("DB_USER is not set in configuration or .env");
    var dbPasswordFromEnv = builder.Configuration["DB_PASSWORD"]
        ?? throw new InvalidOperationException("DB_PASSWORD is not set in configuration or .env");

    connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPasswordFromEnv};";
}
else
{
    var dbPassword = builder.Configuration["DB_PASSWORD"];
    if (connectionString.Contains("Password=;") && !string.IsNullOrWhiteSpace(dbPassword))
    {
        connectionString = connectionString.Replace("Password=;", $"Password={dbPassword};");
    }
}

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("DefaultConnection is not set.");
}

//JWT
var jwtKey = builder.Configuration["JWT:Key"]
    ?? builder.Configuration["JWT_KEY"]
    ?? throw new InvalidOperationException("JWT key is not set (expected JWT:Key or JWT_KEY).");

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

var corsOriginsRaw = builder.Configuration["CORS_ORIGINS"];
var allowedOrigins = !string.IsNullOrWhiteSpace(corsOriginsRaw)
    ? corsOriginsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    : new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

var applyMigrationsOnStartup = builder.Configuration.GetValue("ApplyMigrationsOnStartup", builder.Environment.IsDevelopment());

var applyMigrationsOverride = builder.Configuration["APPLY_MIGRATIONS_ON_STARTUP"];
if (!string.IsNullOrWhiteSpace(applyMigrationsOverride)
    && bool.TryParse(applyMigrationsOverride, out var parsedApplyMigrations))
{
    applyMigrationsOnStartup = parsedApplyMigrations;
}

if (applyMigrationsOnStartup)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.Database.Migrate();
    }
    catch (MySqlException ex) when (ex.Number == 1050)
    {
        logger.LogWarning(ex,
            "Применение миграций пропущено: таблица уже существует. Убедитесь, что база синхронизирована или отключите ApplyMigrationsOnStartup.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Не удалось применить миграции базы данных");
        throw;
    }
}
else
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("ApplyMigrationsOnStartup отключён — миграции не будут запускаться автоматически.");
}

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

static void LoadDotEnvIfPresent()
{
    var possiblePaths = new[]
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.Combine(AppContext.BaseDirectory, ".env")
    };

    string? envPath = null;
    foreach (var path in possiblePaths)
    {
        if (File.Exists(path))
        {
            envPath = path;
            break;
        }
    }

    if (string.IsNullOrEmpty(envPath))
    {
        return;
    }

    foreach (var rawLine in File.ReadAllLines(envPath))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
        {
            continue;
        }

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0)
        {
            continue;
        }

        var key = line[..separatorIndex].Trim();
        var value = line[(separatorIndex + 1)..].Trim().Trim('"');
        if (string.IsNullOrWhiteSpace(key))
        {
            continue;
        }

        Environment.SetEnvironmentVariable(key, value);
    }
}