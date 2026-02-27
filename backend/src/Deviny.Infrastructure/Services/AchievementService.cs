using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Notifications.Events;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Deviny.Infrastructure.Services;

public class AchievementService : IAchievementService
{
    private readonly ApplicationDbContext _context;
    private readonly ILevelService _levelService;
    private readonly IMediator _mediator;
    private readonly IAchievementNotifier _achievementNotifier;
    private readonly ILogger<AchievementService> _logger;

    public AchievementService(
        ApplicationDbContext context,
        ILevelService levelService,
        IMediator mediator,
        IAchievementNotifier achievementNotifier,
        ILogger<AchievementService> logger)
    {
        _context = context;
        _levelService = levelService;
        _mediator = mediator;
        _achievementNotifier = achievementNotifier;
        _logger = logger;
    }

    public async Task<AwardResult> TryAwardAchievementAsync(
        Guid userId,
        string achievementCode,
        AchievementSourceType sourceType,
        Guid? sourceId = null,
        CancellationToken ct = default)
    {
        // 1. Find achievement by code
        var achievement = await _context.Achievements
            .FirstOrDefaultAsync(a => a.Code == achievementCode && a.IsActive, ct);

        if (achievement == null)
        {
            _logger.LogDebug("Achievement {Code} not found or inactive", achievementCode);
            return new AwardResult { Awarded = false };
        }

        // 2. Check role compatibility
        if (achievement.TargetRole != null)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, ct);

            if (user == null) return new AwardResult { Awarded = false };

            var effectiveRole = user.Role == UserRole.Student ? UserRole.User : user.Role;
            if (achievement.TargetRole != effectiveRole)
            {
                _logger.LogDebug(
                    "Achievement {Code} requires role {TargetRole}, user has {UserRole}",
                    achievementCode, achievement.TargetRole, user.Role);
                return new AwardResult { Awarded = false };
            }
        }

        // 3. Check idempotency — already awarded?
        var alreadyAwarded = await _context.UserAchievements
            .AnyAsync(ua => ua.UserId == userId && ua.AchievementId == achievement.Id, ct);

        if (alreadyAwarded)
        {
            _logger.LogDebug(
                "Achievement {Code} already awarded to user {UserId}",
                achievementCode, userId);
            return new AwardResult { Awarded = false };
        }

        // 4. Award the achievement
        var now = DateTime.UtcNow;
        var userAchievement = new UserAchievement
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AchievementId = achievement.Id,
            AwardedAt = now,
            SourceType = sourceType,
            SourceId = sourceId,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.UserAchievements.Add(userAchievement);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "🏆 Achievement {Code} awarded to user {UserId}",
            achievementCode, userId);

        // 5. Award XP if configured
        if (achievement.XpReward > 0)
        {
            try
            {
                await _levelService.AddXpAsync(
                    userId,
                    XpEventType.TrainerAddedAchievement,
                    achievement.XpReward,
                    $"Achievement:{achievement.Id}:{userId}",
                    achievement.Id);

                _logger.LogInformation(
                    "Awarded {XP} XP for achievement {Code} to user {UserId}",
                    achievement.XpReward, achievementCode, userId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to award XP for achievement {Code} to user {UserId}",
                    achievementCode, userId);
            }
        }

        // 6. Update related challenge progress
        try
        {
            var challenge = await _context.Challenges
                .FirstOrDefaultAsync(c => c.AchievementId == achievement.Id && c.IsActive, ct);

            if (challenge != null)
            {
                var progress = await _context.UserChallengeProgress
                    .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == challenge.Id, ct);

                if (progress == null)
                {
                    progress = new UserChallengeProgress
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        ChallengeId = challenge.Id,
                        CurrentValue = 0,
                        Status = ChallengeStatus.Active,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    _context.UserChallengeProgress.Add(progress);
                }

                progress.CurrentValue = Math.Min(progress.CurrentValue + 1, challenge.TargetValue);
                progress.UpdatedAt = now;

                if (progress.CurrentValue >= challenge.TargetValue && progress.Status != ChallengeStatus.Completed)
                {
                    progress.Status = ChallengeStatus.Completed;
                    progress.CompletedAt = now;
                }

                await _context.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to update challenge progress for achievement {Code}",
                achievementCode);
        }

        var result = new AwardResult
        {
            Awarded = true,
            Achievement = new AchievementAwardedDto
            {
                Id = achievement.Id,
                Code = achievement.Code,
                Title = achievement.Title,
                Description = achievement.Description,
                IconKey = achievement.IconKey,
                ColorKey = achievement.ColorKey,
                Rarity = achievement.Rarity.ToString(),
                XpReward = achievement.XpReward
            }
        };

        // Publish domain event — this creates a persistent Notification record
        // AND sends a real-time SignalR push via NotificationService → IRealtimeNotifier.
        try
        {
            await _mediator.Publish(new AchievementAwardedEvent
            {
                UserId = userId,
                AchievementId = achievement.Id,
                AchievementTitle = achievement.Title,
                AchievementIconKey = achievement.IconKey
            }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish AchievementAwardedEvent for {Code}", achievementCode);
        }

        // Send real-time "AchievementAwarded" SignalR event so the frontend can
        // show a toast and trigger an XP/level refresh without a page reload.
        try
        {
            await _achievementNotifier.NotifyAchievementAwardedAsync(
                userId, result.Achievement!, ct);

            _logger.LogInformation(
                "Sent AchievementAwarded SignalR event for {Code} to user {UserId}",
                achievementCode, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to send AchievementAwarded SignalR event for {Code}",
                achievementCode);
        }

        return result;
    }
}
