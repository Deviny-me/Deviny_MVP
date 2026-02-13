using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Trainers.DTOs;
using MediatR;

namespace Deviny.Application.Features.Trainers.Queries;

public class GetAllTrainersQueryHandler : IRequestHandler<GetAllTrainersQuery, List<PublicTrainerDto>>
{
    private readonly ITrainerProfileRepository _trainerProfileRepository;
    private readonly IFileStorageService _fileStorage;

    public GetAllTrainersQueryHandler(
        ITrainerProfileRepository trainerProfileRepository,
        IFileStorageService fileStorage)
    {
        _trainerProfileRepository = trainerProfileRepository;
        _fileStorage = fileStorage;
    }

    public async Task<List<PublicTrainerDto>> Handle(GetAllTrainersQuery request, CancellationToken cancellationToken)
    {
        var trainers = await _trainerProfileRepository.GetAllWithDetailsAsync();

        return trainers.Select(t => new PublicTrainerDto
        {
            Id = t.Id,
            UserId = t.UserId,
            Name = t.User?.FullName ?? "Unknown Trainer",
            AvatarUrl = string.IsNullOrEmpty(t.User?.AvatarUrl) 
                ? "" 
                : _fileStorage.GetPublicUrl(t.User.AvatarUrl),
            PrimaryTitle = t.PrimaryTitle,
            SecondaryTitle = t.SecondaryTitle,
            Location = t.Location,
            ExperienceYears = t.ExperienceYears,
            Slug = t.Slug,
            ProgramsCount = t.ProgramsCount,
            Specializations = t.Specializations
                .Select(s => s.Specialization?.Name ?? "")
                .Where(name => !string.IsNullOrEmpty(name))
                .ToList()
        }).ToList();
    }
}
