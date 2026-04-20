using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetBySlugAsync(string slug);
    Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeUserId = null);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task DeleteAsync(Guid userId, CancellationToken ct = default);
    Task<RefreshToken> AddRefreshTokenAsync(RefreshToken token);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task RevokeRefreshTokenAsync(string token);
}
