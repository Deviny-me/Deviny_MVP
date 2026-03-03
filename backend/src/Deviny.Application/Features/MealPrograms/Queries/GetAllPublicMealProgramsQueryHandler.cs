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
        var (programs, totalCount) = await _mealProgramRepository.GetAllPublicPagedAsync(request.Page, request.PageSize, ct);

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
            StandardSpotsRemaining = 0,
            ProSpotsRemaining = 0,
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
            TrainerRole = p.Trainer?.Role.ToString() ?? ""
        }).ToList();

        return new PagedResponse<PublicMealProgramDto>(dtos, totalCount, request.Page, request.PageSize);
    }
}
