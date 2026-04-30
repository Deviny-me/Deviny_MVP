using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Trainers.DTOs;
using MediatR;

namespace Deviny.Application.Features.Trainers.Queries;

public class GetAllTrainersQueryHandler : IRequestHandler<GetAllTrainersQuery, PagedResponse<PublicTrainerDto>>
{
    private readonly ITrainerProfileRepository _trainerProfileRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly ITrainerRatingService _trainerRatingService;

    public GetAllTrainersQueryHandler(
        ITrainerProfileRepository trainerProfileRepository,
        IFileStorageService fileStorage,
        ITrainerRatingService trainerRatingService)
    {
        _trainerProfileRepository = trainerProfileRepository;
        _fileStorage = fileStorage;
        _trainerRatingService = trainerRatingService;
    }

    public async Task<PagedResponse<PublicTrainerDto>> Handle(
        GetAllTrainersQuery request,
        CancellationToken cancellationToken)
    {
        var hasFilters = !string.IsNullOrWhiteSpace(request.Country) ||
                         !string.IsNullOrWhiteSpace(request.City) ||
                         !string.IsNullOrWhiteSpace(request.Gender) ||
                         !string.IsNullOrWhiteSpace(request.Specialization) ||
                         (request.MinRating.HasValue && request.MinRating.Value > 0);

        var (trainers, totalCount) = hasFilters
            ? await _trainerProfileRepository.GetAllFilteredPagedAsync(
                request.Page, request.PageSize,
                request.Country, request.City, request.Gender, request.Specialization, request.MinRating)
            : await _trainerProfileRepository.GetAllWithDetailsPagedAsync(request.Page, request.PageSize, request.MinRating);

        if (trainers.Count == 0)
            return new PagedResponse<PublicTrainerDto>(new List<PublicTrainerDto>(), totalCount, request.Page, request.PageSize);

        var trainerUserIds = trainers.Select(t => t.UserId).ToList();

        // Batch load all ratings in 2 queries instead of 2N
        var ratingsDict = await _trainerRatingService
            .GetTrainerRatingsBatchAsync(trainerUserIds, cancellationToken);

        var result = trainers.Select(t =>
        {
            ratingsDict.TryGetValue(t.UserId, out var rating);

            return new PublicTrainerDto
            {
                Id = t.Id,
                UserId = t.UserId,
                Name = t.User?.FullName ?? "Unknown Trainer",
                AvatarUrl = string.IsNullOrEmpty(t.User?.AvatarUrl)
                    ? string.Empty
                    : _fileStorage.GetPublicUrl(t.User.AvatarUrl),
                PrimaryTitle = t.PrimaryTitle,
                SecondaryTitle = t.SecondaryTitle,
                Location = t.Location,
                ExperienceYears = t.ExperienceYears,
                Slug = t.Slug,
                Role = t.User?.Role.ToString() ?? "Trainer",
                ProgramsCount = t.ProgramsCount,
                Specializations = t.Specializations
                    .Select(s => s.Specialization?.Name)
                    .Where(name => !string.IsNullOrEmpty(name))
                    .ToList(),
                RatingValue = rating?.RatingValue ?? 0,
                ReviewsCount = rating?.ReviewsCount ?? 0,
                TotalSales = rating?.TotalSales ?? 0,
                ActivityRatingValue = rating?.ActivityRatingValue ?? 0
            };
        }).ToList();

        return new PagedResponse<PublicTrainerDto>(result, totalCount, request.Page, request.PageSize);
    }
}
