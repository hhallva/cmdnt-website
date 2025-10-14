using DataLayer.Data;
using DataLayer.DTOs;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is not set.");

var dbPassword = builder.Configuration["DB_PASSWORD"]
    ?? throw new InvalidOperationException("DB_PASSWORD is not set.");

connectionString = connectionString.Replace("Password=;", $"Password={dbPassword};");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(connectionString));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

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

