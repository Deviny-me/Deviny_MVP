using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Trainers.DTOs;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Services;

public class TrainerRatingService : ITrainerRatingService
{
    private readonly ApplicationDbContext _context;

    public TrainerRatingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TrainerRatingDto> GetTrainerRatingAsync(Guid trainerUserId, CancellationToken ct = default)
    {
        // Single SQL query for program stats
        var programStats = await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => p.TrainerId == trainerUserId && !p.IsDeleted)
            .GroupBy(p => p.TrainerId)
            .Select(g => new
            {
                AvgRating = g.SelectMany(p => p.Reviews).Any()
                    ? g.SelectMany(p => p.Reviews).Average(r => (double)r.Rating)
                    : 0.0,
                ReviewsCount = g.SelectMany(p => p.Reviews).Count(),
                TotalSales = g.SelectMany(p => p.Purchases)
                    .Count(pu => pu.Status == ProgramPurchaseStatus.Active
                              || pu.Status == ProgramPurchaseStatus.Completed)
            })
            .FirstOrDefaultAsync(ct);

        var reviewsCount = programStats?.ReviewsCount ?? 0;
        var averageRating = programStats?.AvgRating ?? 0.0;
        var totalSales = programStats?.TotalSales ?? 0;

        var reviewScoreNorm = reviewsCount > 0 ? averageRating / 5.0 : 0.0;
        var salesScoreNorm = totalSales > 0 ? Math.Min(1.0, totalSales / 20.0) : 0.0;
        var combinedNorm = 0.7 * reviewScoreNorm + 0.3 * salesScoreNorm;
        var ratingValue = Math.Round(combinedNorm * 5.0, 2);

        // Single SQL query for activity stats
        var activityStats = await _context.UserPosts
            .AsNoTracking()
            .Where(up => up.UserId == trainerUserId && !up.IsDeleted)
            .GroupBy(up => up.UserId)
            .Select(g => new
            {
                TotalLikes = g.SelectMany(p => p.Likes).Count(),
                TotalComments = g.SelectMany(p => p.Comments).Count()
            })
            .FirstOrDefaultAsync(ct);

        var totalLikes = activityStats?.TotalLikes ?? 0;
        var totalComments = activityStats?.TotalComments ?? 0;
        var interactions = totalLikes + totalComments;
        var activityNorm = interactions > 0 ? Math.Min(1.0, interactions / 100.0) : 0.0;
        var activityRating = Math.Round(activityNorm * 5.0, 2);

        return new TrainerRatingDto
        {
            TrainerUserId = trainerUserId,
            RatingValue = ratingValue,
            ReviewsCount = reviewsCount,
            TotalSales = totalSales,
            ActivityRatingValue = activityRating,
            TotalLikes = totalLikes,
            TotalComments = totalComments
        };
    }

    public async Task<Dictionary<Guid, TrainerRatingDto>> GetTrainerRatingsBatchAsync(List<Guid> trainerUserIds, CancellationToken ct = default)
    {
        if (trainerUserIds.Count == 0)
            return new Dictionary<Guid, TrainerRatingDto>();

        // Batch query: program stats (ratings + sales) for all trainers at once
        var programStats = await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => trainerUserIds.Contains(p.TrainerId) && !p.IsDeleted)
            .GroupBy(p => p.TrainerId)
            .Select(g => new
            {
                TrainerId = g.Key,
                AvgRating = g.SelectMany(p => p.Reviews).Any()
                    ? g.SelectMany(p => p.Reviews).Average(r => (double)r.Rating)
                    : 0.0,
                ReviewsCount = g.SelectMany(p => p.Reviews).Count(),
                TotalSales = g.SelectMany(p => p.Purchases)
                    .Count(pu => pu.Status == ProgramPurchaseStatus.Active
                              || pu.Status == ProgramPurchaseStatus.Completed)
            })
            .ToListAsync(ct);

        // Batch query: activity stats (likes + comments) for all trainers at once
        var activityStats = await _context.UserPosts
            .AsNoTracking()
            .Where(up => trainerUserIds.Contains(up.UserId) && !up.IsDeleted)
            .GroupBy(up => up.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalLikes = g.SelectMany(p => p.Likes).Count(),
                TotalComments = g.SelectMany(p => p.Comments).Count()
            })
            .ToListAsync(ct);

        var programStatsDict = programStats.ToDictionary(x => x.TrainerId);
        var activityStatsDict = activityStats.ToDictionary(x => x.UserId);

        var result = new Dictionary<Guid, TrainerRatingDto>();

        foreach (var userId in trainerUserIds)
        {
            programStatsDict.TryGetValue(userId, out var ps);
            var reviewsCount = ps?.ReviewsCount ?? 0;
            var averageRating = ps?.AvgRating ?? 0.0;
            var totalSales = ps?.TotalSales ?? 0;

            var reviewScoreNorm = reviewsCount > 0 ? averageRating / 5.0 : 0.0;
            var salesScoreNorm = totalSales > 0 ? Math.Min(1.0, totalSales / 20.0) : 0.0;
            var combinedNorm = 0.7 * reviewScoreNorm + 0.3 * salesScoreNorm;
            var ratingValue = Math.Round(combinedNorm * 5.0, 2);

            activityStatsDict.TryGetValue(userId, out var acts);
            var totalLikes = acts?.TotalLikes ?? 0;
            var totalComments = acts?.TotalComments ?? 0;
            var interactions = totalLikes + totalComments;
            var activityNorm = interactions > 0 ? Math.Min(1.0, interactions / 100.0) : 0.0;
            var activityRating = Math.Round(activityNorm * 5.0, 2);

            result[userId] = new TrainerRatingDto
            {
                TrainerUserId = userId,
                RatingValue = ratingValue,
                ReviewsCount = reviewsCount,
                TotalSales = totalSales,
                ActivityRatingValue = activityRating,
                TotalLikes = totalLikes,
                TotalComments = totalComments
            };
        }

        return result;
    }
}

