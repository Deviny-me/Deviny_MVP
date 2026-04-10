using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.MealPrograms.DTOs;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.MealPrograms.Queries;

public class GetAllPublicMealProgramsQueryHandler : IRequestHandler<GetAllPublicMealProgramsQuery, PagedResponse<PublicMealProgramDto>>
{
    private readonly IMealProgramRepository _mealProgramRepository;
    private readonly IFileStorageService _fileStorage;

    public GetAllPublicMealProgramsQueryHandler(
        IMealProgramRepository mealProgramRepository,
        IFileStorageService fileStorage)
    {
        _mealProgramRepository = mealProgramRepository;
        _fileStorage = fileStorage;
    }

    public async Task<PagedResponse<PublicMealProgramDto>> Handle(GetAllPublicMealProgramsQuery request, CancellationToken ct)
    {
        var (programs, totalCount) = await _mealProgramRepository.GetAllPublicPagedAsync(
            request.Page, request.PageSize, ct, request.MinPrice, request.MaxPrice, request.Tier);

        var dtos = programs.Select(p => new PublicMealProgramDto
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            Price = p.Price,
            StandardPrice = p.StandardPrice,
            ProPrice = p.ProPrice,
            MaxStandardSpots = p.MaxStandardSpots,
            MaxProSpots = p.MaxProSpots,
            Category = p.Category.ToString(),
            StandardSpotsRemaining = (p.MaxStandardSpots ?? 0) > 0
                ? Math.Max(0, p.MaxStandardSpots!.Value - p.Purchases.Count(pu => pu.Tier == Deviny.Domain.Enums.ProgramTier.Standard && pu.Status == Deviny.Domain.Enums.ProgramPurchaseStatus.Active))
                : 0,
            ProSpotsRemaining = (p.MaxProSpots ?? 0) > 0
                ? Math.Max(0, p.MaxProSpots!.Value - p.Purchases.Count(pu => pu.Tier == Deviny.Domain.Enums.ProgramTier.Pro && pu.Status == Deviny.Domain.Enums.ProgramPurchaseStatus.Active))
                : 0,
            Code = p.Code,
            CoverImageUrl = string.IsNullOrEmpty(p.CoverImagePath)
                ? ""
                : _fileStorage.GetPublicUrl(p.CoverImagePath),
            VideoUrls = string.IsNullOrEmpty(p.VideosPath)
                ? new List<string>()
                : (JsonSerializer.Deserialize<List<string>>(p.VideosPath) ?? new List<string>())
                    .Select(v => _fileStorage.GetPublicUrl(v)).ToList(),
            CreatedAt = p.CreatedAt,
            TrainerId = p.TrainerId,
            TrainerName = p.Trainer?.FullName ?? "Unknown",
            TrainerAvatarUrl = string.IsNullOrEmpty(p.Trainer?.AvatarUrl)
                ? ""
                : _fileStorage.GetPublicUrl(p.Trainer.AvatarUrl),
            TrainerSlug = p.Trainer?.TrainerProfile?.Slug ?? "",
            TrainerRole = p.Trainer?.Role.ToString() ?? "",
            AverageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => (double)r.Rating), 1) : 0,
            TotalReviews = p.Reviews.Count,
            TotalPurchases = p.Purchases.Count,
            LatestReviewComment = p.Reviews
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => r.Comment)
                .FirstOrDefault(),
            LatestReviewRating = p.Reviews
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => (int?)r.Rating)
                .FirstOrDefault(),
            LatestReviewUserName = p.Reviews
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => r.User.FirstName + " " + r.User.LastName)
                .FirstOrDefault(),
            LatestReviewCreatedAt = p.Reviews
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => (DateTime?)r.CreatedAt)
                .FirstOrDefault()
        }).ToList();

        // Post-filter by rating and sales (computed in memory)
        if (request.MinRating.HasValue && request.MinRating.Value > 0)
            dtos = dtos.Where(d => d.AverageRating >= request.MinRating.Value).ToList();
        if (request.MinSales.HasValue && request.MinSales.Value > 0)
            dtos = dtos.Where(d => d.TotalPurchases >= request.MinSales.Value).ToList();

        var filteredCount = (request.MinRating.HasValue && request.MinRating.Value > 0) || (request.MinSales.HasValue && request.MinSales.Value > 0)
            ? dtos.Count
            : totalCount;

        return new PagedResponse<PublicMealProgramDto>(dtos, filteredCount, request.Page, request.PageSize);
    }
}
