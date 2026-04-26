using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IUserFollowRepository
{
    Task<UserFollow?> GetFollowAsync(Guid followerId, Guid trainerId);
    Task<bool> AreMutualFollowsAsync(Guid userId1, Guid userId2);
    Task<DateTime?> GetMutualFollowSinceAsync(Guid userId1, Guid userId2);
    Task<(List<(User Friend, DateTime FriendsSince)> Items, int TotalCount)> GetMutualFriendsPagedAsync(Guid userId, int page, int pageSize);
    Task DeleteMutualFollowPairAsync(Guid userId1, Guid userId2);
    Task<List<(User Trainer, DateTime FollowedAt)>> GetFollowingAsync(Guid userId);
    Task<(List<(User Trainer, DateTime FollowedAt)> Items, int TotalCount)> GetFollowingPagedAsync(Guid userId, int page, int pageSize);
    Task<(List<(User Follower, DateTime FollowedAt)> Items, int TotalCount)> GetFollowersPagedAsync(Guid userId, int page, int pageSize);
    Task<int> GetFollowingCountAsync(Guid userId);
    Task<int> GetFollowerCountAsync(Guid trainerId);
    Task<List<Guid>> GetFollowerIdsAsync(Guid trainerId, CancellationToken ct = default);
    Task AddAsync(UserFollow userFollow);
    Task DeleteAsync(UserFollow userFollow);
}
