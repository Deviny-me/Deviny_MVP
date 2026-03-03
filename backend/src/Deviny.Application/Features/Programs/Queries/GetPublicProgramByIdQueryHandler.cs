using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

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
        var s = await _programRepository.GetByIdPublicWithStatsAsync(request.Id);

        if (s == null)
            return null;

        return new PublicProgramDto
        {
            Id = s.Program.Id,
            Title = s.Program.Title,
            Description = s.Program.Description,
            Price = s.Program.Price,
            StandardPrice = s.Program.StandardPrice,
            ProPrice = s.Program.ProPrice,
            MaxStandardSpots = s.Program.MaxStandardSpots,
            MaxProSpots = s.Program.MaxProSpots,
            Category = s.Program.Category.ToString(),
            StandardSpotsRemaining = (s.Program.MaxStandardSpots ?? 0) > 0
                ? Math.Max(0, s.Program.MaxStandardSpots!.Value - s.StandardSpotsUsed)
                : 0,
            ProSpotsRemaining = (s.Program.MaxProSpots ?? 0) > 0
                ? Math.Max(0, s.Program.MaxProSpots!.Value - s.ProSpotsUsed)
                : 0,
            Code = s.Program.Code,
            CoverImageUrl = string.IsNullOrEmpty(s.Program.CoverImagePath)
                ? ""
                : _fileStorage.GetPublicUrl(s.Program.CoverImagePath),
            AverageRating = s.AverageRating,
            TotalReviews = s.TotalReviews,
            TotalPurchases = s.TotalPurchases,
            CreatedAt = s.Program.CreatedAt,
            TrainerId = s.Program.TrainerId,
            TrainerName = s.TrainerFullName ?? "Unknown Trainer",
            TrainerAvatarUrl = string.IsNullOrEmpty(s.TrainerAvatarUrl)
                ? ""
                : _fileStorage.GetPublicUrl(s.TrainerAvatarUrl),
            TrainerSlug = s.TrainerSlug ?? ""
        };
    }
}
