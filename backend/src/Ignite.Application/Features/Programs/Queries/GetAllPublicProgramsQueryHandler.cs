using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Programs.DTOs;
using Ignite.Domain.Enums;
using MediatR;

namespace Ignite.Application.Features.Programs.Queries;

public class GetAllPublicProgramsQueryHandler : IRequestHandler<GetAllPublicProgramsQuery, List<PublicProgramDto>>
{
    private readonly IProgramRepository _programRepository;

    public GetAllPublicProgramsQueryHandler(IProgramRepository programRepository)
    {
        _programRepository = programRepository;
    }

    public async Task<List<PublicProgramDto>> Handle(GetAllPublicProgramsQuery request, CancellationToken cancellationToken)
    {
        var programs = await _programRepository.GetAllPublicAsync();

        return programs.Select(p => new PublicProgramDto
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            Price = p.Price,
            Code = p.Code,
            CoverImageUrl = string.IsNullOrEmpty(p.CoverImagePath) 
                ? "" 
                : $"http://localhost:5000{p.CoverImagePath}",
            AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0,
            TotalReviews = p.Reviews.Count,
            TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
            CreatedAt = p.CreatedAt,
            TrainerId = p.TrainerId,
            TrainerName = p.Trainer?.FullName ?? "Unknown Trainer",
            TrainerAvatarUrl = string.IsNullOrEmpty(p.Trainer?.AvatarUrl) 
                ? "" 
                : $"http://localhost:5000{p.Trainer.AvatarUrl}",
            TrainerSlug = p.Trainer?.TrainerProfile?.Slug ?? ""
        }).ToList();
    }
}
