using Deviny.Domain.Enums;

namespace Deviny.Application.Common.Interfaces;

/// <summary>
/// Pushes real-time notifications to connected users via SignalR.
/// </summary>
public interface IRealtimeNotifier
{
    Task SendNotificationAsync(Guid userId, object notification, CancellationToken ct = default);
    Task SendUnreadCountAsync(Guid userId, int count, CancellationToken ct = default);
    Task SendFriendRequestReceivedAsync(Guid receiverId, object requestData, CancellationToken ct = default);
    Task SendFriendRequestAcceptedAsync(Guid userId, object requestData, CancellationToken ct = default);
    Task SendFriendRemovedAsync(Guid userId, object data, CancellationToken ct = default);
}
