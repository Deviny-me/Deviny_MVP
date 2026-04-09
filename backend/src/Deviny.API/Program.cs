using System.Text;
using Deviny.API.Hubs;
using Deviny.API.Middleware;
using Deviny.API.Services;
using Deviny.Application;
using Deviny.Application.Common.Interfaces;
using Deviny.Infrastructure;
using Deviny.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Ensure wwwroot is found regardless of working directory
var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootPath))
    Directory.CreateDirectory(wwwrootPath);
builder.Environment.WebRootPath = wwwrootPath;

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Deviny API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddSignalR();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<IAchievementNotifier, SignalRAchievementNotifier>();
builder.Services.AddScoped<ILevelNotifier, SignalRLevelNotifier>();
builder.Services.AddScoped<IRealtimeNotifier, SignalRRealtimeNotifier>();

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

// Build allowed CORS origins from configuration + defaults
var corsOrigins = new List<string>
{
    "http://localhost:3000", "http://localhost:3001", "http://localhost:3002",
    "https://app.deviny.me", "https://deviny.me", "https://www.deviny.me"
};
var clientAppUrl = builder.Configuration["ClientAppUrl"];
if (!string.IsNullOrEmpty(clientAppUrl) && !corsOrigins.Contains(clientAppUrl))
    corsOrigins.Add(clientAppUrl);
// Additional origins from config (semicolon-separated)
var extraOrigins = builder.Configuration["CorsOrigins"];
if (!string.IsNullOrEmpty(extraOrigins))
{
    foreach (var o in extraOrigins.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        if (!corsOrigins.Contains(o)) corsOrigins.Add(o);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins.ToArray())
              .SetIsOriginAllowed(origin =>
                  origin.StartsWith("http://localhost:") ||
                  corsOrigins.Contains(origin))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition");
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Deviny API v1");
        options.RoutePrefix = "swagger"; // /swagger
    });
}

app.UseCors("AllowFrontend");

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

// Apply migrations
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("🔄 Applying migrations...");
        await context.Database.MigrateAsync();
        logger.LogInformation("✅ Migrations applied.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "⚠️ Migration attempt finished with error (DB may already be up to date).");
    }

    // Seed database with initial data
    try
    {
        logger.LogInformation("🌱 Starting database seed...");
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await Deviny.Infrastructure.Persistence.DatabaseSeeder.SeedAsync(context, passwordHasher);
        await Deviny.Infrastructure.Persistence.DatabaseSeeder.SeedAchievementsAsync(context);
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
