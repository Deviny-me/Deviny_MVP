using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IUserChallengeProgressRepository
{
    Task<List<UserChallengeProgress>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<UserChallengeProgress?> GetAsync(Guid userId, Guid challengeId, CancellationToken ct = default);
    Task<UserChallengeProgress> GetOrCreateAsync(Guid userId, Guid challengeId, CancellationToken ct = default);
    Task UpdateAsync(UserChallengeProgress entity, CancellationToken ct = default);
}
