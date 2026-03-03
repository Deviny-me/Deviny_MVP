using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Levels.DTOs;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Services;

public class UserRatingService : IUserRatingService
{
    private readonly ApplicationDbContext _context;
    private readonly ILevelService _levelService;

    public UserRatingService(ApplicationDbContext context, ILevelService levelService)
    {
        _context = context;
        _levelService = levelService;
    }

    public async Task<UserRatingDto> GetUserRatingAsync(Guid userId, UserRole role, CancellationToken ct = default)
    {
        // Level (already encapsulates XP, challenges, etc.)
        var levelInfoTask = _levelService.GetUserLevelAsync(userId);

        // Run all three counts in parallel
        var completedProgramsTask = _context.ProgramPurchases
            .AsNoTracking()
            .CountAsync(pp => pp.UserId == userId && pp.Status == ProgramPurchaseStatus.Completed, ct);

        var completedChallengesTask = _context.UserChallengeProgress
            .AsNoTracking()
            .CountAsync(cp => cp.UserId == userId && cp.Status == ChallengeStatus.Completed, ct);

        var achievementsTask = _context.UserAchievements
            .AsNoTracking()
            .CountAsync(ua => ua.UserId == userId, ct);

        await Task.WhenAll(levelInfoTask, completedProgramsTask, completedChallengesTask, achievementsTask);

        var level = levelInfoTask.Result.CurrentLevel;
        var completedProgramsCount = completedProgramsTask.Result;
        var completedChallengesCount = completedChallengesTask.Result;
        var achievementsCount = achievementsTask.Result;

        // Aggregate rating on a 0-100 scale using simple weighted components
        var levelScore = Math.Min(level * 2, 40);                    // up to 40 points (level 20+)
        var programsScore = Math.Min(completedProgramsCount * 5, 30); // up to 30 points (6+ programs)
        var challengesScore = Math.Min(completedChallengesCount * 2, 20); // up to 20 points (10+ challenges)
        var achievementsScore = Math.Min(achievementsCount * 1, 10);  // up to 10 points (10+ achievements)

        var totalScore = levelScore + programsScore + challengesScore + achievementsScore;
        var ratingValue = Math.Round((double)totalScore, 1); // 0-100

        return new UserRatingDto
        {
            Level = level,
            CompletedProgramsCount = completedProgramsCount,
            CompletedChallengesCount = completedChallengesCount,
            AchievementsCount = achievementsCount,
            RatingValue = ratingValue
        };
    }
}

