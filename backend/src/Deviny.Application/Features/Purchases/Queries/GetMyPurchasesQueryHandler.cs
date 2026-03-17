using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Purchases.DTOs;
using Deviny.Application.Features.Programs;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Purchases.Queries;

public class GetMyPurchasesQueryHandler : IRequestHandler<GetMyPurchasesQuery, List<PurchasedProgramDto>>
{
    private readonly IProgramPurchaseRepository _purchaseRepository;
    private readonly IFileStorageService _fileStorage;

    public GetMyPurchasesQueryHandler(
        IProgramPurchaseRepository purchaseRepository,
        IFileStorageService fileStorage)
    {
        _purchaseRepository = purchaseRepository;
        _fileStorage = fileStorage;
    }

    public async Task<List<PurchasedProgramDto>> Handle(GetMyPurchasesQuery request, CancellationToken cancellationToken)
    {
        var purchases = await _purchaseRepository.GetByUserIdAsync(request.UserId);

        return purchases.Select(pp =>
        {
            if (pp.ProgramType == ProgramType.Training && pp.TrainingProgram != null)
            {
                var tp = pp.TrainingProgram;
                var videos = ParseVideos(tp.TrainingVideosPath);
                return new PurchasedProgramDto
                {
                    PurchaseId = pp.Id,
                    ProgramId = tp.Id,
                    ProgramType = "training",
                    Title = tp.Title,
                    Description = tp.Description,
                    CoverImageUrl = string.IsNullOrEmpty(tp.CoverImagePath)
                        ? "" : _fileStorage.GetPublicUrl(tp.CoverImagePath),
                    VideoUrls = videos.Select(v => v.VideoUrl).ToList(),
                    Videos = videos,
                    Tier = pp.Tier.ToString(),
                    Category = tp.Category.ToString(),
                    PurchasedAt = pp.PurchasedAt,
                    TrainerName = tp.Trainer?.FullName ?? "Unknown",
                    TrainerAvatarUrl = tp.Trainer?.AvatarUrl != null
                        ? _fileStorage.GetPublicUrl(tp.Trainer.AvatarUrl)
                        : "",
                    TrainerId = tp.TrainerId,
                    AverageRating = tp.Reviews != null && tp.Reviews.Any()
                        ? Math.Round(tp.Reviews.Average(r => r.Rating), 1)
                        : 0,
                    TotalReviews = tp.Reviews?.Count ?? 0,
                    PurchaseStatus = pp.Status.ToString(),
                    CanReview = pp.Status == ProgramPurchaseStatus.Completed,
                    HasReviewed = tp.Reviews?.Any(r => r.UserId == request.UserId) ?? false
                };
            }
            else if (pp.ProgramType == ProgramType.Meal && pp.MealProgram != null)
            {
                var mp = pp.MealProgram;
                var videos = ParseVideos(mp.VideosPath);
                return new PurchasedProgramDto
                {
                    PurchaseId = pp.Id,
                    ProgramId = mp.Id,
                    ProgramType = "meal",
                    Title = mp.Title,
                    Description = mp.Description,
                    CoverImageUrl = string.IsNullOrEmpty(mp.CoverImagePath)
                        ? "" : _fileStorage.GetPublicUrl(mp.CoverImagePath),
                    VideoUrls = videos.Select(v => v.VideoUrl).ToList(),
                    Videos = videos,
                    Tier = pp.Tier.ToString(),
                    Category = mp.Category.ToString(),
                    PurchasedAt = pp.PurchasedAt,
                    TrainerName = mp.Trainer?.FullName ?? "Unknown",
                    TrainerAvatarUrl = mp.Trainer?.AvatarUrl != null
                        ? _fileStorage.GetPublicUrl(mp.Trainer.AvatarUrl)
                        : "",
                    TrainerId = mp.TrainerId,
                    AverageRating = mp.Reviews != null && mp.Reviews.Any()
                        ? Math.Round(mp.Reviews.Average(r => r.Rating), 1)
                        : 0,
                    TotalReviews = mp.Reviews?.Count ?? 0,
                    PurchaseStatus = pp.Status.ToString(),
                    CanReview = pp.Status == ProgramPurchaseStatus.Completed,
                    HasReviewed = mp.Reviews?.Any(r => r.UserId == request.UserId) ?? false
                };
            }

            // Fallback — shouldn't happen with valid data
            return new PurchasedProgramDto
            {
                PurchaseId = pp.Id,
                ProgramType = pp.ProgramType.ToString().ToLower(),
                Tier = pp.Tier.ToString(),
                PurchasedAt = pp.PurchasedAt,
                PurchaseStatus = pp.Status.ToString(),
                CanReview = pp.Status == ProgramPurchaseStatus.Completed,
                HasReviewed = false
            };
        }).ToList();
    }

    private List<ProgramVideoDto> ParseVideos(string? videosJson)
    {
        return ProgramVideoJsonHelper.Parse(videosJson)
            .Where(v => !string.IsNullOrWhiteSpace(v.VideoUrl))
            .Select(v => new ProgramVideoDto
            {
                VideoUrl = _fileStorage.GetPublicUrl(v.VideoUrl),
                Title = v.Title,
                Description = v.Description,
            })
            .ToList();
    }
}
