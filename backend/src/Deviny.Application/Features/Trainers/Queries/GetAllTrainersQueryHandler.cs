using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Trainers.DTOs;
using MediatR;

namespace Deviny.Application.Features.Trainers.Queries;

public class GetAllTrainersQueryHandler : IRequestHandler<GetAllTrainersQuery, List<PublicTrainerDto>>
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

    public async Task<List<PublicTrainerDto>> Handle(
    GetAllTrainersQuery request,
    CancellationToken cancellationToken)
    {
        var trainers = await _trainerProfileRepository.GetAllWithDetailsAsync();

        var result = await Task.WhenAll(
            trainers.Select(async t =>
            {
                var rating = await _trainerRatingService
                    .GetTrainerRatingAsync(t.UserId, cancellationToken);

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
                    RatingValue = rating.RatingValue,
                    ReviewsCount = rating.ReviewsCount,
                    TotalSales = rating.TotalSales,
                    ActivityRatingValue = rating.ActivityRatingValue
                };
            })
        );

        return result.ToList();
    }
}
