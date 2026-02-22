using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Domain.Enums;
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
            DetailedDescription = program.DetailedDescription,
            Price = program.Price,
            ProPrice = program.ProPrice,
            Code = program.Code,
            CoverImageUrl = program.CoverImagePath,
            TrainingVideoUrls = videoPaths,
            AverageRating = program.Reviews.Any() ? program.Reviews.Average(r => r.Rating) : 0,
            TotalReviews = program.Reviews.Count,
            TotalPurchases = program.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
            CreatedAt = program.CreatedAt,
            UpdatedAt = program.UpdatedAt
        };
    }
}
