using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Reviews.DTOs;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Reviews.Queries;

public class GetProgramReviewsQueryHandler : IRequestHandler<GetProgramReviewsQuery, List<ReviewDto>>
{
    private readonly IProgramReviewRepository _reviewRepository;
    private readonly IFileStorageService _fileStorage;

    public GetProgramReviewsQueryHandler(
        IProgramReviewRepository reviewRepository,
        IFileStorageService fileStorage)
    {
        _reviewRepository = reviewRepository;
        _fileStorage = fileStorage;
    }

    public async Task<List<ReviewDto>> Handle(GetProgramReviewsQuery request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<ProgramType>(request.ProgramType, ignoreCase: true, out var programType))
            return new List<ReviewDto>();

        var reviews = await _reviewRepository.GetByProgramAsync(request.ProgramId, programType);

        return reviews.Select(r => new ReviewDto
        {
            Id = r.Id,
            UserId = r.UserId,
            UserName = r.User?.FullName ?? "Unknown",
            UserAvatarUrl = string.IsNullOrEmpty(r.User?.AvatarUrl)
                ? ""
                : _fileStorage.GetPublicUrl(r.User.AvatarUrl),
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        }).ToList();
    }
}
