using Ignite.Domain.Entities;

namespace Ignite.Application.Common.Interfaces;

public interface IUserFollowRepository
{
    Task<UserFollow?> GetFollowAsync(Guid followerId, Guid trainerId);
    Task<List<User>> GetFollowingAsync(Guid userId);
    Task<int> GetFollowerCountAsync(Guid trainerId);
    Task AddAsync(UserFollow userFollow);
    Task DeleteAsync(UserFollow userFollow);
}
