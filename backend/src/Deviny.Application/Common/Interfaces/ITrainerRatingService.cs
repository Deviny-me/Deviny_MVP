using Deviny.Application.Features.Trainers.DTOs;

namespace Deviny.Application.Common.Interfaces;

public interface ITrainerRatingService
{
    Task<TrainerRatingDto> GetTrainerRatingAsync(Guid trainerUserId, CancellationToken ct = default);
}

