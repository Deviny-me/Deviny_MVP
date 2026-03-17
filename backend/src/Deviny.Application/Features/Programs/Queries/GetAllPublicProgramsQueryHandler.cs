using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public class GetAllPublicProgramsQueryHandler : IRequestHandler<GetAllPublicProgramsQuery, PagedResponse<PublicProgramDto>>
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

    public async Task<PagedResponse<PublicProgramDto>> Handle(GetAllPublicProgramsQuery request, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _programRepository.GetAllPublicWithStatsPagedAsync(request.Page, request.PageSize);

        var dtos = items.Select(s => new PublicProgramDto
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
            LatestReviewComment = s.LatestReviewComment,
            LatestReviewRating = s.LatestReviewRating,
            LatestReviewUserName = s.LatestReviewUserName,
            LatestReviewCreatedAt = s.LatestReviewCreatedAt,
            CreatedAt = s.Program.CreatedAt,
            TrainerId = s.Program.TrainerId,
            TrainerName = s.TrainerFullName ?? "Unknown Trainer",
            TrainerAvatarUrl = string.IsNullOrEmpty(s.TrainerAvatarUrl) 
                ? "" 
                : _fileStorage.GetPublicUrl(s.TrainerAvatarUrl),
            TrainerSlug = s.TrainerSlug ?? "",
            TrainerRole = s.TrainerRole ?? ""
        }).ToList();

        return new PagedResponse<PublicProgramDto>(dtos, totalCount, request.Page, request.PageSize);
    }
}
