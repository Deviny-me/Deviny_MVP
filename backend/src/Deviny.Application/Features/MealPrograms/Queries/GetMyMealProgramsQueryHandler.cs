using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.MealPrograms.DTOs;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.MealPrograms.Queries;

public class GetMyMealProgramsQueryHandler : IRequestHandler<GetMyMealProgramsQuery, List<MealProgramDto>>
{
    private readonly IMealProgramRepository _mealProgramRepository;

    public GetMyMealProgramsQueryHandler(IMealProgramRepository mealProgramRepository)
    {
        _mealProgramRepository = mealProgramRepository;
    }

    public async Task<List<MealProgramDto>> Handle(GetMyMealProgramsQuery request, CancellationToken ct)
    {
        var programs = await _mealProgramRepository.GetByTrainerIdAsync(request.TrainerId, ct);

        return programs.Select(p => new MealProgramDto
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            DetailedDescription = p.DetailedDescription,
            Price = p.Price,
            ProPrice = p.ProPrice,
            Code = p.Code,
            CoverImageUrl = p.CoverImagePath,
            VideoUrls = string.IsNullOrEmpty(p.VideosPath)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(p.VideosPath) ?? new List<string>(),
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();
    }
}
