using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Programs.DTOs;
using Ignite.Domain.Enums;
using MediatR;
using System.Text.Json;

namespace Ignite.Application.Features.Programs.Queries;

public class GetProgramByCodeQueryHandler : IRequestHandler<GetProgramByCodeQuery, ProgramDto?>
{
    private readonly IProgramRepository _programRepository;

    public GetProgramByCodeQueryHandler(IProgramRepository programRepository)
    {
        _programRepository = programRepository;
    }

    public async Task<ProgramDto?> Handle(GetProgramByCodeQuery request, CancellationToken cancellationToken)
    {
        var program = await _programRepository.GetByCodeAsync(request.Code);

        if (program == null || program.IsDeleted)
        {
            return null;
        }

        var videoPaths = string.IsNullOrEmpty(program.TrainingVideosPath) 
            ? new List<string>() 
            : JsonSerializer.Deserialize<List<string>>(program.TrainingVideosPath) ?? new List<string>();

        return new ProgramDto
        {
            Id = program.Id,
            Title = program.Title,
            Description = program.Description,
            Price = program.Price,
            Code = program.Code,
            CoverImageUrl = $"http://localhost:5000{program.CoverImagePath}",
            TrainingVideoUrls = videoPaths.Select(v => $"http://localhost:5000{v}").ToList(),
            AverageRating = program.Reviews.Any() ? program.Reviews.Average(r => r.Rating) : 0,
            TotalReviews = program.Reviews.Count,
            TotalPurchases = program.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
            CreatedAt = program.CreatedAt,
            UpdatedAt = program.UpdatedAt
        };
    }
}
