using Deviny.Domain.Entities;
using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

public interface IFriendRequestRepository
{
    Task<FriendRequest?> GetByIdAsync(int id);
    Task<FriendRequest?> GetActiveRequestBetweenUsersAsync(Guid userId1, Guid userId2);
    Task<FriendRequest?> GetAcceptedRequestBetweenUsersAsync(Guid userId1, Guid userId2);
    Task<bool> AreFriendsAsync(Guid userId1, Guid userId2);
    Task<List<FriendRequest>> GetIncomingRequestsAsync(Guid userId);
    Task<List<FriendRequest>> GetOutgoingRequestsAsync(Guid userId);
    Task<List<(User Friend, DateTime FriendsSince)>> GetFriendsAsync(Guid userId);
    Task AddAsync(FriendRequest friendRequest);
    Task UpdateAsync(FriendRequest friendRequest);
    Task DeleteAsync(FriendRequest friendRequest);
    Task DeleteFriendshipAsync(Guid userId1, Guid userId2);
}
