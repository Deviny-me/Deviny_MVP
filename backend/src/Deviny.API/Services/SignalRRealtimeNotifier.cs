using Deviny.API.Hubs;
using Deviny.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Deviny.API.Services;

/// <summary>
/// Pushes real-time notifications to connected users via SignalR.
/// Uses the user's personal group (user:{id}).
/// </summary>
public class SignalRRealtimeNotifier : IRealtimeNotifier
{
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ILogger<SignalRRealtimeNotifier> _logger;

    public SignalRRealtimeNotifier(
        IHubContext<ChatHub> hubContext,
        ILogger<SignalRRealtimeNotifier> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendNotificationAsync(Guid userId, object notification, CancellationToken ct = default)
    {
        var group = $"user:{userId.ToString().ToLowerInvariant()}";
        await _hubContext.Clients.Group(group).SendAsync("NotificationReceived", notification, ct);
        _logger.LogDebug("Sent real-time notification to user {UserId}", userId);
    }

    public async Task SendUnreadCountAsync(Guid userId, int count, CancellationToken ct = default)
    {
        var group = $"user:{userId.ToString().ToLowerInvariant()}";
        await _hubContext.Clients.Group(group).SendAsync("NotificationCountUpdated", new { unreadCount = count }, ct);
    }

    public async Task SendFriendRequestReceivedAsync(Guid receiverId, object requestData, CancellationToken ct = default)
    {
        var group = $"user:{receiverId.ToString().ToLowerInvariant()}";
        await _hubContext.Clients.Group(group).SendAsync("FriendRequestReceived", requestData, ct);
        _logger.LogDebug("Sent friend request notification to user {UserId}", receiverId);
    }

    public async Task SendFriendRequestAcceptedAsync(Guid userId, object requestData, CancellationToken ct = default)
    {
        var group = $"user:{userId.ToString().ToLowerInvariant()}";
        await _hubContext.Clients.Group(group).SendAsync("FriendRequestAccepted", requestData, ct);
        _logger.LogDebug("Sent friend request accepted notification to user {UserId}", userId);
    }

    public async Task SendFriendRemovedAsync(Guid userId, object data, CancellationToken ct = default)
    {
        var group = $"user:{userId.ToString().ToLowerInvariant()}";
        await _hubContext.Clients.Group(group).SendAsync("FriendRemoved", data, ct);
        _logger.LogDebug("Sent friend removed notification to user {UserId}", userId);
    }
}
