using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Reviews.DTOs;
using MediatR;

namespace Deviny.Application.Features.Reviews.Queries;

public class GetExpertReviewsQueryHandler : IRequestHandler<GetExpertReviewsQuery, List<ExpertReviewDto>>
{
    private readonly IProgramReviewRepository _reviewRepository;
    private readonly IFileStorageService _fileStorage;

    public GetExpertReviewsQueryHandler(
        IProgramReviewRepository reviewRepository,
        IFileStorageService fileStorage)
    {
        _reviewRepository = reviewRepository;
        _fileStorage = fileStorage;
    }

    public async Task<List<ExpertReviewDto>> Handle(GetExpertReviewsQuery request, CancellationToken cancellationToken)
    {
        var reviews = await _reviewRepository.GetByExpertAsync(request.ExpertId);

        return reviews.Select(r => new ExpertReviewDto
        {
            Id = r.Id,
            UserId = r.UserId,
            UserName = r.User?.FullName ?? "Unknown",
            UserAvatarUrl = string.IsNullOrEmpty(r.User?.AvatarUrl)
                ? ""
                : _fileStorage.GetPublicUrl(r.User.AvatarUrl),
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt,
            ProgramId = r.TrainingProgramId ?? r.MealProgramId ?? Guid.Empty,
            ProgramTitle = r.TrainingProgram?.Title ?? r.MealProgram?.Title ?? "Unknown",
            ProgramType = r.ProgramType.ToString().ToLower()
        }).ToList();
    }
}
