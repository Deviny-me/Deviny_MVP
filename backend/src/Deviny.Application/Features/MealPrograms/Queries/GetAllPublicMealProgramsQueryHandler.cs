using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.MealPrograms.DTOs;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.MealPrograms.Queries;

public class GetAllPublicMealProgramsQueryHandler : IRequestHandler<GetAllPublicMealProgramsQuery, List<PublicMealProgramDto>>
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

    public async Task<List<PublicMealProgramDto>> Handle(GetAllPublicMealProgramsQuery request, CancellationToken ct)
    {
        var programs = await _mealProgramRepository.GetAllPublicAsync(ct);

        return programs.Select(p => new PublicMealProgramDto
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            Price = p.Price,
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
            TrainerSlug = p.Trainer?.TrainerProfile?.Slug ?? ""
        }).ToList();
    }
}
