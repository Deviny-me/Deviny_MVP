using System.Text;
using Ignite.API.Hubs;
using Ignite.API.Middleware;
using Ignite.Application;
using Ignite.Application.Common.Interfaces;
using Ignite.Infrastructure;
using Ignite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddSignalR();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtKey = builder.Configuration["Jwt:Key"] 
    ?? throw new InvalidOperationException("JWT Key is not configured. Please set Jwt:Key in appsettings.json or environment variables.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Support SignalR token from query string
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                // Let the default JWT handler read from Authorization header otherwise
                
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Allow localhost for development
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002")
              .SetIsOriginAllowed(origin => origin.StartsWith("http://localhost:"))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition");
    });
});

var app = builder.Build();

// CORS must be FIRST - it handles preflight requests
app.UseCors("AllowFrontend");

// Global exception handler
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// Apply migrations
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    logger.LogInformation("🔄 Applying migrations...");
    await context.Database.MigrateAsync();
    logger.LogInformation("✅ Migrations applied.");
    
    // Seed database with initial data
    try
    {
        logger.LogInformation("🌱 Starting database seed...");
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await Ignite.Infrastructure.Persistence.DatabaseSeeder.SeedAsync(context, passwordHasher);
        logger.LogInformation("✅ Database seed completed.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Error during database seeding");
    }
}

// app.UseHttpsRedirection(); // Отключено для разработки

// Configure static files middleware
app.UseStaticFiles(); // Для wwwroot

// Раздавать uploads папку
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "uploads")),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat").RequireCors("AllowFrontend");

app.Run();
