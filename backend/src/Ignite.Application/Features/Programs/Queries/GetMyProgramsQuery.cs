using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Programs.DTOs;
using Ignite.Domain.Enums;
using MediatR;
using System.Text.Json;

namespace Ignite.Application.Features.Programs.Queries;

public class GetMyProgramsQuery : IRequest<List<ProgramDto>>
{
    public Guid TrainerId { get; set; }
}

public class GetMyProgramsQueryHandler : IRequestHandler<GetMyProgramsQuery, List<ProgramDto>>
{
    private readonly IProgramRepository _programRepository;

    public GetMyProgramsQueryHandler(IProgramRepository programRepository)
    {
        _programRepository = programRepository;
    }

    public async Task<List<ProgramDto>> Handle(GetMyProgramsQuery request, CancellationToken cancellationToken)
    {
        var programs = await _programRepository.GetByTrainerIdAsync(request.TrainerId);

        return programs.Select(p =>
        {
            var videoPaths = string.IsNullOrEmpty(p.TrainingVideosPath) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(p.TrainingVideosPath) ?? new List<string>();

            return new ProgramDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                Price = p.Price,
                Code = p.Code,
                CoverImageUrl = $"http://localhost:5000{p.CoverImagePath}",
                TrainingVideoUrls = videoPaths.Select(v => $"http://localhost:5000{v}").ToList(),
                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0,
                TotalReviews = p.Reviews.Count,
                TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            };
        }).ToList();
    }
}
