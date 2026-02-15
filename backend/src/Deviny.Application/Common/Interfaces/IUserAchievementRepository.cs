using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IUserAchievementRepository
{
    Task<bool> ExistsAsync(Guid userId, Guid achievementId, CancellationToken ct = default);
    Task<List<UserAchievement>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(UserAchievement entity, CancellationToken ct = default);
}
