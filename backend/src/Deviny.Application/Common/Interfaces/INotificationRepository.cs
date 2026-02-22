using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface INotificationRepository
{
    Task<List<Notification>> GetByUserIdAsync(Guid userId, DateTime? cursor, int limit, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task<Notification?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Notification> AddAsync(Notification notification, CancellationToken ct = default);
    Task AddRangeAsync(List<Notification> notifications, CancellationToken ct = default);
    Task<bool> MarkAsReadAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<int> MarkAllAsReadAsync(Guid userId, CancellationToken ct = default);
}
