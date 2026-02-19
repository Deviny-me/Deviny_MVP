using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IChallengeRepository
{
    Task<List<Challenge>> GetAllActiveAsync(CancellationToken ct = default);
    Task<Challenge?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<Challenge?> GetByAchievementIdAsync(Guid achievementId, CancellationToken ct = default);
}
