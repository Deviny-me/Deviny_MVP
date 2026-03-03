using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using MediatR;
using System.Text.Json;

namespace Deviny.Application.Features.Programs.Queries;

public class GetProgramByCodeQueryHandler : IRequestHandler<GetProgramByCodeQuery, ProgramDto?>
{
    private readonly IProgramRepository _programRepository;

    public GetProgramByCodeQueryHandler(IProgramRepository programRepository)
    {
        _programRepository = programRepository;
    }

    public async Task<ProgramDto?> Handle(GetProgramByCodeQuery request, CancellationToken cancellationToken)
    {
        var s = await _programRepository.GetByCodeWithStatsAsync(request.Code);

        if (s == null)
        {
            return null;
        }

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
            Code = s.Program.Code,
            CoverImageUrl = s.Program.CoverImagePath,
            TrainingVideoUrls = videoPaths,
            AverageRating = s.AverageRating,
            TotalReviews = s.TotalReviews,
            TotalPurchases = s.TotalPurchases,
            CreatedAt = s.Program.CreatedAt,
            UpdatedAt = s.Program.UpdatedAt
        };
    }
}
