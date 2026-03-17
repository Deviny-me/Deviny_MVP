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
    Task SendEntityChangedAsync(
        Guid userId,
        string scope,
        string action,
        string? entityType = null,
        Guid? entityId = null,
        object? payload = null,
        CancellationToken ct = default);
    Task SendEntityChangedToUsersAsync(
        IEnumerable<Guid> userIds,
        string scope,
        string action,
        string? entityType = null,
        Guid? entityId = null,
        object? payload = null,
        CancellationToken ct = default);
    Task SendGlobalEntityChangedAsync(
        string scope,
        string action,
        string? entityType = null,
        Guid? entityId = null,
        object? payload = null,
        CancellationToken ct = default);
}
