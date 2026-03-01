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
        // Collect all training programs created by this trainer
        var programs = await _context.TrainingPrograms
            .AsNoTracking()
            .Where(p => p.TrainerId == trainerUserId && !p.IsDeleted)
            .Include(p => p.Reviews)
            .Include(p => p.Purchases)
            .ToListAsync(ct);

        var allReviews = programs.SelectMany(p => p.Reviews).ToList();
        var reviewsCount = allReviews.Count;
        var averageRating = reviewsCount > 0
            ? allReviews.Average(r => r.Rating)
            : 0.0;

        var totalSales = programs
            .SelectMany(p => p.Purchases)
            .Count(pu => pu.Status == ProgramPurchaseStatus.Active || pu.Status == ProgramPurchaseStatus.Completed);

        // Normalize review score (0-1) and sales score (0-1), then combine into 0-5 rating
        var reviewScoreNorm = reviewsCount > 0 ? averageRating / 5.0 : 0.0;
        var salesScoreNorm = totalSales > 0 ? Math.Min(1.0, totalSales / 20.0) : 0.0; // 20+ sales gives full sales score

        var combinedNorm = 0.7 * reviewScoreNorm + 0.3 * salesScoreNorm;
        var ratingValue = Math.Round(combinedNorm * 5.0, 2); // 0-5

        // Activity rating based on likes and comments on trainer's posts
        var posts = await _context.UserPosts
            .AsNoTracking()
            .Where(up => up.UserId == trainerUserId && !up.IsDeleted)
            .Include(up => up.Likes)
            .Include(up => up.Comments)
            .ToListAsync(ct);

        var totalLikes = posts.Sum(p => p.Likes.Count);
        var totalComments = posts.Sum(p => p.Comments.Count);
        var interactions = totalLikes + totalComments;

        var activityNorm = interactions > 0 ? Math.Min(1.0, interactions / 100.0) : 0.0; // 100+ interactions -> full
        var activityRating = Math.Round(activityNorm * 5.0, 2); // 0-5

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
}

