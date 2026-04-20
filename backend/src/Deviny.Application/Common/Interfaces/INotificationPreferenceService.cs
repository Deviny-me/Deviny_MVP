using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

public interface INotificationPreferenceService
{
    Task<bool> CanReceiveAsync(Guid userId, NotificationType type, CancellationToken ct = default);
}