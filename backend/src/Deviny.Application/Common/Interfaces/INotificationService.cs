using Deviny.Domain.Entities;
using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

public interface INotificationService
{
    Task<Notification> CreateAsync(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        CancellationToken ct = default);

    Task CreateForManyAsync(
        List<Guid> userIds,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        CancellationToken ct = default);
}
