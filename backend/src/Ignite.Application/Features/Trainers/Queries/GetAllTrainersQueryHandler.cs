using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Trainers.DTOs;
using MediatR;

namespace Ignite.Application.Features.Trainers.Queries;

public class GetAllTrainersQueryHandler : IRequestHandler<GetAllTrainersQuery, List<PublicTrainerDto>>
{
    private readonly ITrainerProfileRepository _trainerProfileRepository;

    public GetAllTrainersQueryHandler(ITrainerProfileRepository trainerProfileRepository)
    {
        _trainerProfileRepository = trainerProfileRepository;
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
                : $"http://localhost:5000{t.User.AvatarUrl}",
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
