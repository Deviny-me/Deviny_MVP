using Ignite.Domain.Entities;
using Ignite.Domain.Enums;

namespace Ignite.Application.Common.Interfaces;

public interface IFriendRequestRepository
{
    Task<FriendRequest?> GetByIdAsync(int id);
    Task<FriendRequest?> GetActiveRequestBetweenUsersAsync(Guid userId1, Guid userId2);
    Task<bool> AreFriendsAsync(Guid userId1, Guid userId2);
    Task<List<FriendRequest>> GetIncomingRequestsAsync(Guid userId);
    Task<List<FriendRequest>> GetOutgoingRequestsAsync(Guid userId);
    Task<List<User>> GetFriendsAsync(Guid userId);
    Task AddAsync(FriendRequest friendRequest);
    Task UpdateAsync(FriendRequest friendRequest);
    Task DeleteAsync(FriendRequest friendRequest);
    Task DeleteFriendshipAsync(Guid userId1, Guid userId2);
}
