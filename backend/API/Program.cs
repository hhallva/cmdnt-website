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