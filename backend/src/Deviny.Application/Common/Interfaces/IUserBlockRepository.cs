using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IUserBlockRepository
{
    Task<UserBlock?> GetBlockAsync(Guid blockerId, Guid blockedUserId);
    Task<bool> IsBlockedAsync(Guid userId1, Guid userId2);
    Task AddAsync(UserBlock userBlock);
    Task DeleteAsync(UserBlock userBlock);
}
