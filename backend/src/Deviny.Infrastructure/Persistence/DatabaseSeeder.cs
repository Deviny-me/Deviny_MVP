using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        System.Diagnostics.Debug.WriteLine("🔍 Checking if database needs seeding...");
        
        // Check if database is already seeded
        var hasUsers = await context.Users.AnyAsync();
        System.Diagnostics.Debug.WriteLine($"Has users: {hasUsers}");
        
        if (hasUsers)
        {
            System.Diagnostics.Debug.WriteLine("⏩ Database already contains users, skipping seed.");
            return; // Database already seeded
        }

        System.Diagnostics.Debug.WriteLine("🌱 Starting database seed...");
        
        // Create test users
        var testUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@test.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = passwordHasher.HashPassword("password123"),
            Role = UserRole.User,
            IsActive = true,
            IsEmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Slug = "test-user"
        };

        var testTrainer = new User
        {
            Id = Guid.NewGuid(),
            Email = "trainer@test.com",
            FirstName = "Test",
            LastName = "Trainer",
            PasswordHash = passwordHasher.HashPassword("password123"),
            Role = UserRole.Trainer,
            IsActive = true,
            IsEmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Slug = "test-trainer"
        };

        context.Users.AddRange(testUser, testTrainer);
        await context.SaveChangesAsync();

        // Seed level definitions
        var levels = new List<LevelDefinition>
        {
            new() { Level = 1, Title = "Новичок", RequiredXp = 0, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Level = 2, Title = "Начинающий", RequiredXp = 100, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Level = 3, Title = "Любитель", RequiredXp = 300, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Level = 4, Title = "Продвинутый", RequiredXp = 600, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Level = 5, Title = "Эксперт", RequiredXp = 1000, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
        };

        context.LevelDefinitions.AddRange(levels);

        // Create initial user levels with level 1
        var userLevels = new List<UserLevel>
        {
            new() 
            { 
                UserId = testUser.Id, 
                CurrentLevel = 1, 
                CurrentXp = 0, 
                LifetimeXp = 0,
                UpdatedAt = DateTime.UtcNow
            },
            new() 
            { 
                UserId = testTrainer.Id, 
                CurrentLevel = 1, 
                CurrentXp = 0, 
                LifetimeXp = 0,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.UserLevels.AddRange(userLevels);

        // Create trainer profile for test trainer
        var trainerProfile = new TrainerProfile
        {
            Id = Guid.NewGuid(),
            UserId = testTrainer.Id,
            Slug = "test-trainer-profile",
            PrimaryTitle = "Certified Personal Trainer",
            Location = "Online",
            ExperienceYears = 5,
            AboutText = "Опытный тренер с 5+ летним стажем в фитнесе и персональных тренировках",
            ProgramsCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.TrainerProfiles.Add(trainerProfile);

        await context.SaveChangesAsync();

        Console.WriteLine("✅ Database seeded successfully!");
        Console.WriteLine($"   - Test User: user@test.com / password123");
        Console.WriteLine($"   - Test Trainer: trainer@test.com / password123");
    }
}
