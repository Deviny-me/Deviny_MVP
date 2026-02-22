using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IUserFollowRepository
{
    Task<UserFollow?> GetFollowAsync(Guid followerId, Guid trainerId);
    Task<List<(User Trainer, DateTime FollowedAt)>> GetFollowingAsync(Guid userId);
    Task<int> GetFollowerCountAsync(Guid trainerId);
    Task<List<Guid>> GetFollowerIdsAsync(Guid trainerId, CancellationToken ct = default);
    Task AddAsync(UserFollow userFollow);
    Task DeleteAsync(UserFollow userFollow);
}
