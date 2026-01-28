using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Levels.DTOs;
using Ignite.Domain.Entities;
using Ignite.Domain.Enums;
using Ignite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ignite.Infrastructure.Services;

public class LevelService : ILevelService
{
    private readonly ApplicationDbContext _context;

    public LevelService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AddXpResult> AddXpAsync(Guid userId, XpEventType eventType, int xpAmount, string idempotencyKey, Guid? sourceEntityId = null)
    {
        // Check idempotency - soft fail if already processed
        var existingTransaction = await _context.XpTransactions
            .FirstOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey);

        if (existingTransaction != null)
        {
            var currentState = await GetUserLevelAsync(userId);
            return new AddXpResult
            {
                Success = true,
                WasAlreadyProcessed = true,
                LeveledUp = false,
                NewLevel = currentState.CurrentLevel,
                XpAdded = 0,
                CurrentState = currentState
            };
        }

        // Ensure user level exists
        await EnsureUserLevelExistsAsync(userId);

        // Get user level
        var userLevel = await _context.UserLevels
            .FirstAsync(ul => ul.UserId == userId);

        var oldLevel = userLevel.CurrentLevel;

        // Create XP transaction
        var transaction = new XpTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EventType = eventType,
            XpAmount = xpAmount,
            IdempotencyKey = idempotencyKey,
            SourceEntityId = sourceEntityId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.XpTransactions.Add(transaction);

        // Update user XP
        userLevel.LifetimeXp += xpAmount;
        userLevel.UpdatedAt = DateTime.UtcNow;

        // Recalculate level based on LifetimeXp
        var newLevel = await CalculateLevelAsync(userLevel.LifetimeXp);
        
        var leveledUp = newLevel > oldLevel;
        if (leveledUp)
        {
            userLevel.CurrentLevel = newLevel;
            userLevel.LastLevelUpAt = DateTime.UtcNow;
        }

        // Calculate CurrentXp (XP within current level)
        var currentLevelDef = await _context.LevelDefinitions
            .FirstOrDefaultAsync(ld => ld.Level == userLevel.CurrentLevel);
        
        userLevel.CurrentXp = userLevel.LifetimeXp - (currentLevelDef?.RequiredXp ?? 0);

        await _context.SaveChangesAsync();

        var finalState = await GetUserLevelAsync(userId);

        return new AddXpResult
        {
            Success = true,
            WasAlreadyProcessed = false,
            LeveledUp = leveledUp,
            NewLevel = newLevel,
            XpAdded = xpAmount,
            CurrentState = finalState
        };
    }

    public async Task<UserLevelDto> GetUserLevelAsync(Guid userId)
    {
        await EnsureUserLevelExistsAsync(userId);

        var userLevel = await _context.UserLevels
            .FirstAsync(ul => ul.UserId == userId);

        var currentLevelDef = await _context.LevelDefinitions
            .FirstOrDefaultAsync(ld => ld.Level == userLevel.CurrentLevel);

        var nextLevelDef = await _context.LevelDefinitions
            .FirstOrDefaultAsync(ld => ld.Level == userLevel.CurrentLevel + 1);

        int xpToNextLevel = 0;
        int requiredXpForNextLevel = 0;
        double progressPercent = 100;

        if (nextLevelDef != null && currentLevelDef != null)
        {
            var xpInCurrentLevel = userLevel.LifetimeXp - currentLevelDef.RequiredXp;
            var xpNeededForNextLevel = nextLevelDef.RequiredXp - currentLevelDef.RequiredXp;
            
            xpToNextLevel = nextLevelDef.RequiredXp - userLevel.LifetimeXp;
            requiredXpForNextLevel = xpNeededForNextLevel;
            progressPercent = xpNeededForNextLevel > 0 
                ? Math.Min(100, (double)xpInCurrentLevel / xpNeededForNextLevel * 100) 
                : 100;
        }

        return new UserLevelDto
        {
            CurrentLevel = userLevel.CurrentLevel,
            CurrentXp = userLevel.CurrentXp,
            XpToNextLevel = Math.Max(0, xpToNextLevel),
            RequiredXpForNextLevel = requiredXpForNextLevel,
            ProgressPercent = Math.Round(progressPercent, 1),
            LifetimeXp = userLevel.LifetimeXp,
            LevelTitle = currentLevelDef?.Title,
            NextLevelTitle = nextLevelDef?.Title
        };
    }

    public async Task EnsureUserLevelExistsAsync(Guid userId)
    {
        var exists = await _context.UserLevels.AnyAsync(ul => ul.UserId == userId);
        
        if (!exists)
        {
            var userLevel = new UserLevel
            {
                UserId = userId,
                CurrentLevel = 1,
                CurrentXp = 0,
                LifetimeXp = 0,
                UpdatedAt = DateTime.UtcNow
            };

            _context.UserLevels.Add(userLevel);
            await _context.SaveChangesAsync();
        }
    }

    private async Task<int> CalculateLevelAsync(int lifetimeXp)
    {
        var level = await _context.LevelDefinitions
            .Where(ld => ld.RequiredXp <= lifetimeXp)
            .OrderByDescending(ld => ld.Level)
            .Select(ld => ld.Level)
            .FirstOrDefaultAsync();

        return level > 0 ? level : 1;
    }
}
