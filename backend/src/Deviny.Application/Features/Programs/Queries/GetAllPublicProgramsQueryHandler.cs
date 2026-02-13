using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public class GetAllPublicProgramsQueryHandler : IRequestHandler<GetAllPublicProgramsQuery, List<PublicProgramDto>>
{
    private readonly IProgramRepository _programRepository;
    private readonly IFileStorageService _fileStorage;

    public GetAllPublicProgramsQueryHandler(
        IProgramRepository programRepository,
        IFileStorageService fileStorage)
    {
        _programRepository = programRepository;
        _fileStorage = fileStorage;
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
                : _fileStorage.GetPublicUrl(p.CoverImagePath),
            AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0,
            TotalReviews = p.Reviews.Count,
            TotalPurchases = p.Purchases.Count(pu => pu.Status == ProgramPurchaseStatus.Active),
            CreatedAt = p.CreatedAt,
            TrainerId = p.TrainerId,
            TrainerName = p.Trainer?.FullName ?? "Unknown Trainer",
            TrainerAvatarUrl = string.IsNullOrEmpty(p.Trainer?.AvatarUrl) 
                ? "" 
                : _fileStorage.GetPublicUrl(p.Trainer.AvatarUrl),
            TrainerSlug = p.Trainer?.TrainerProfile?.Slug ?? ""
        }).ToList();
    }
}
