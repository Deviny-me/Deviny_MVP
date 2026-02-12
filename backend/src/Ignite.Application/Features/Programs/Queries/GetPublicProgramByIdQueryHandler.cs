using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Programs.DTOs;
using Ignite.Domain.Enums;
using MediatR;

namespace Ignite.Application.Features.Programs.Queries;

public class GetPublicProgramByIdQueryHandler : IRequestHandler<GetPublicProgramByIdQuery, PublicProgramDto?>
{
    private readonly IProgramRepository _programRepository;
    private readonly IFileStorageService _fileStorage;

    public GetPublicProgramByIdQueryHandler(
        IProgramRepository programRepository,
        IFileStorageService fileStorage)
    {
        _programRepository = programRepository;
        _fileStorage = fileStorage;
    }

    public async Task<PublicProgramDto?> Handle(GetPublicProgramByIdQuery request, CancellationToken cancellationToken)
    {
        var p = await _programRepository.GetByIdPublicAsync(request.Id);

        if (p == null)
            return null;

        return new PublicProgramDto
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
        };
    }
}
