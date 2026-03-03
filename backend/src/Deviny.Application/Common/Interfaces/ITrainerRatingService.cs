using Deviny.Application.Features.Trainers.DTOs;

namespace Deviny.Application.Common.Interfaces;

public interface ITrainerRatingService
{
    Task<TrainerRatingDto> GetTrainerRatingAsync(Guid trainerUserId, CancellationToken ct = default);
    Task<Dictionary<Guid, TrainerRatingDto>> GetTrainerRatingsBatchAsync(List<Guid> trainerUserIds, CancellationToken ct = default);
}

