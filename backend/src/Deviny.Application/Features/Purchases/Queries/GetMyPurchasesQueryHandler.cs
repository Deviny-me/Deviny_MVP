using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Purchases.DTOs;
using Deviny.Domain.Enums;
using MediatR;
using System.Text.Json;

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
                return new PurchasedProgramDto
                {
                    PurchaseId = pp.Id,
                    ProgramId = tp.Id,
                    ProgramType = "training",
                    Title = tp.Title,
                    Description = tp.Description,
                    CoverImageUrl = string.IsNullOrEmpty(tp.CoverImagePath)
                        ? "" : _fileStorage.GetPublicUrl(tp.CoverImagePath),
                    VideoUrls = ParseVideoPaths(tp.TrainingVideosPath),
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
                    TotalReviews = tp.Reviews?.Count ?? 0
                };
            }
            else if (pp.ProgramType == ProgramType.Meal && pp.MealProgram != null)
            {
                var mp = pp.MealProgram;
                return new PurchasedProgramDto
                {
                    PurchaseId = pp.Id,
                    ProgramId = mp.Id,
                    ProgramType = "meal",
                    Title = mp.Title,
                    Description = mp.Description,
                    CoverImageUrl = string.IsNullOrEmpty(mp.CoverImagePath)
                        ? "" : _fileStorage.GetPublicUrl(mp.CoverImagePath),
                    VideoUrls = ParseVideoPaths(mp.VideosPath),
                    Tier = pp.Tier.ToString(),
                    Category = mp.Category.ToString(),
                    PurchasedAt = pp.PurchasedAt,
                    TrainerName = mp.Trainer?.FullName ?? "Unknown",
                    TrainerAvatarUrl = mp.Trainer?.AvatarUrl != null
                        ? _fileStorage.GetPublicUrl(mp.Trainer.AvatarUrl)
                        : "",
                    TrainerId = mp.TrainerId,
                    AverageRating = 0,
                    TotalReviews = 0
                };
            }

            // Fallback — shouldn't happen with valid data
            return new PurchasedProgramDto
            {
                PurchaseId = pp.Id,
                ProgramType = pp.ProgramType.ToString().ToLower(),
                Tier = pp.Tier.ToString(),
                PurchasedAt = pp.PurchasedAt
            };
        }).ToList();
    }

    private List<string> ParseVideoPaths(string? videosJson)
    {
        if (string.IsNullOrWhiteSpace(videosJson))
            return new List<string>();

        try
        {
            var paths = JsonSerializer.Deserialize<List<string>>(videosJson);
            return paths?
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => _fileStorage.GetPublicUrl(p))
                .ToList() ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}
