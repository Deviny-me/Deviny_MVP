using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.Programs.Queries;

public class GetMyProgramsQueryHandler : IRequestHandler<GetMyProgramsQuery, List<ProgramDto>>
{
    private readonly IProgramRepository _programRepository;

    public GetMyProgramsQueryHandler(IProgramRepository programRepository)
    {
        _programRepository = programRepository;
    }

    public async Task<List<ProgramDto>> Handle(GetMyProgramsQuery request, CancellationToken cancellationToken)
    {
        var items = await _programRepository.GetByTrainerIdWithStatsAsync(request.TrainerId);

        return items.Select(s =>
        {
            var videoPaths = string.IsNullOrEmpty(s.Program.TrainingVideosPath) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(s.Program.TrainingVideosPath) ?? new List<string>();

            return new ProgramDto
            {
                Id = s.Program.Id,
                Title = s.Program.Title,
                Description = s.Program.Description,
                DetailedDescription = s.Program.DetailedDescription,
                Price = s.Program.Price,
                StandardPrice = s.Program.StandardPrice,
                ProPrice = s.Program.ProPrice,
                MaxStandardSpots = s.Program.MaxStandardSpots,
                MaxProSpots = s.Program.MaxProSpots,
                Category = s.Program.Category.ToString(),
                Code = s.Program.Code,
                CoverImageUrl = s.Program.CoverImagePath,
                TrainingVideoUrls = videoPaths,
                IsPublic = s.Program.IsPublic,
                AverageRating = s.AverageRating,
                TotalReviews = s.TotalReviews,
                TotalPurchases = s.TotalPurchases,
                CreatedAt = s.Program.CreatedAt,
                UpdatedAt = s.Program.UpdatedAt
            };
        }).ToList();
    }
}
