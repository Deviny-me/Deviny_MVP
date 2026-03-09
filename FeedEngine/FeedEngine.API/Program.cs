using FeedEngine.Infrastructure.Persistence;
using FeedEngine.Infrastructure.Services;
using FeedEngine.Domain.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Database: PostgreSQL.
var connectionString = builder.Configuration.GetConnectionString("FeedDatabase")
    ?? builder.Configuration["FeedDatabase"]
    ?? "Host=localhost;Port=5432;Database=FeedEngine;Username=postgres;Password=postgres";

builder.Services.AddDbContext<FeedDbContext>(options =>
    options.UseNpgsql(connectionString));

// Application services
builder.Services.AddScoped<IFeedRepository, FeedRepository>();
builder.Services.AddSingleton<IFeedRankingService, FeedRankingService>();
builder.Services.AddScoped<IFeedService, FeedService>();

// OpenAPI / Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
