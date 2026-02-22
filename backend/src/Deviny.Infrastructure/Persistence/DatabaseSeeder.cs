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

    /// <summary>
    /// Seeds achievements and challenges. Runs independently — safe to call on existing databases.
    /// </summary>
    public static async Task SeedAchievementsAsync(ApplicationDbContext context)
    {
        if (await context.Achievements.AnyAsync())
        {
            System.Diagnostics.Debug.WriteLine("⏩ Achievements already seeded, skipping.");
            return;
        }

        var now = DateTime.UtcNow;

        // ── Achievements ──
        var firstPost = new Achievement
        {
            Id = Guid.NewGuid(),
            Code = "FIRST_POST",
            Title = "Первый пост",
            Description = "Опубликуйте свой первый пост",
            IconKey = "pen-line",
            ColorKey = "blue",
            Rarity = AchievementRarity.Common,
            XpReward = 25,
            IsActive = true,
            TargetRole = null, // available to all roles
            CreatedAt = now,
            UpdatedAt = now
        };

        var firstMessage = new Achievement
        {
            Id = Guid.NewGuid(),
            Code = "FIRST_MESSAGE_SENT",
            Title = "Первое сообщение",
            Description = "Отправьте своё первое сообщение",
            IconKey = "message-circle",
            ColorKey = "green",
            Rarity = AchievementRarity.Common,
            XpReward = 15,
            IsActive = true,
            TargetRole = null,
            CreatedAt = now,
            UpdatedAt = now
        };

        var firstProgram = new Achievement
        {
            Id = Guid.NewGuid(),
            Code = "FIRST_PROGRAM_CREATED",
            Title = "Первая программа",
            Description = "Создайте свою первую тренировочную программу",
            IconKey = "dumbbell",
            ColorKey = "purple",
            Rarity = AchievementRarity.Rare,
            XpReward = 50,
            IsActive = true,
            TargetRole = null,
            CreatedAt = now,
            UpdatedAt = now
        };

        // ── Nutritionist-specific achievements ──
        var firstMealPlan = new Achievement
        {
            Id = Guid.NewGuid(),
            Code = "FIRST_MEAL_PLAN",
            Title = "Автор рациона",
            Description = "Создайте свою первую программу питания",
            IconKey = "apple",
            ColorKey = "green",
            Rarity = AchievementRarity.Rare,
            XpReward = 50,
            IsActive = true,
            TargetRole = UserRole.Nutritionist,
            CreatedAt = now,
            UpdatedAt = now
        };

        var nutriBlogger = new Achievement
        {
            Id = Guid.NewGuid(),
            Code = "NUTRI_FIRST_POST",
            Title = "Нутри-блогер",
            Description = "Опубликуйте свой первый пост как нутриолог",
            IconKey = "pen-line",
            ColorKey = "teal",
            Rarity = AchievementRarity.Common,
            XpReward = 25,
            IsActive = true,
            TargetRole = UserRole.Nutritionist,
            CreatedAt = now,
            UpdatedAt = now
        };

        var nutriMentor = new Achievement
        {
            Id = Guid.NewGuid(),
            Code = "NUTRI_FIRST_MESSAGE",
            Title = "Забота о клиенте",
            Description = "Отправьте первое сообщение клиенту",
            IconKey = "message-circle",
            ColorKey = "emerald",
            Rarity = AchievementRarity.Common,
            XpReward = 20,
            IsActive = true,
            TargetRole = UserRole.Nutritionist,
            CreatedAt = now,
            UpdatedAt = now
        };

        context.Achievements.AddRange(firstPost, firstMessage, firstProgram, firstMealPlan, nutriBlogger, nutriMentor);
        await context.SaveChangesAsync();

        // ── Challenges (linked 1-to-1 with achievements) ──
        var challenges = new List<Challenge>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Code = "CHALLENGE_FIRST_POST",
                Title = "Опубликуй пост",
                Description = "Создайте и опубликуйте свой первый пост в ленте",
                Type = ChallengeType.OneTime,
                TargetValue = 1,
                IsActive = true,
                TargetRole = null,
                AchievementId = firstPost.Id,
                CreatedAt = now,
                UpdatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Code = "CHALLENGE_FIRST_MESSAGE",
                Title = "Напиши сообщение",
                Description = "Отправьте первое сообщение другому пользователю",
                Type = ChallengeType.OneTime,
                TargetValue = 1,
                IsActive = true,
                TargetRole = null,
                AchievementId = firstMessage.Id,
                CreatedAt = now,
                UpdatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Code = "CHALLENGE_FIRST_PROGRAM",
                Title = "Создай программу",
                Description = "Создайте свою первую тренировочную программу",
                Type = ChallengeType.OneTime,
                TargetValue = 1,
                IsActive = true,
                TargetRole = null,
                AchievementId = firstProgram.Id,
                CreatedAt = now,
                UpdatedAt = now
            },
            // ── Nutritionist-specific challenges ──
            new()
            {
                Id = Guid.NewGuid(),
                Code = "CHALLENGE_FIRST_MEAL_PLAN",
                Title = "Создай рацион",
                Description = "Создайте свою первую программу питания",
                Type = ChallengeType.OneTime,
                TargetValue = 1,
                IsActive = true,
                TargetRole = UserRole.Nutritionist,
                AchievementId = firstMealPlan.Id,
                CreatedAt = now,
                UpdatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Code = "CHALLENGE_NUTRI_FIRST_POST",
                Title = "Поделись знаниями",
                Description = "Опубликуйте свой первый пост как нутриолог",
                Type = ChallengeType.OneTime,
                TargetValue = 1,
                IsActive = true,
                TargetRole = UserRole.Nutritionist,
                AchievementId = nutriBlogger.Id,
                CreatedAt = now,
                UpdatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Code = "CHALLENGE_NUTRI_FIRST_MESSAGE",
                Title = "Свяжись с клиентом",
                Description = "Отправьте первое сообщение клиенту",
                Type = ChallengeType.OneTime,
                TargetValue = 1,
                IsActive = true,
                TargetRole = UserRole.Nutritionist,
                AchievementId = nutriMentor.Id,
                CreatedAt = now,
                UpdatedAt = now
            }
        };

        context.Challenges.AddRange(challenges);
        await context.SaveChangesAsync();

        Console.WriteLine("✅ Achievements & challenges seeded (6 achievements, 6 challenges).");
    }
}
