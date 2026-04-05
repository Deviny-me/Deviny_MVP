using Deviny.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRequestDeclinedNotificationHandler : INotificationHandler<FriendRequestDeclinedEvent>
{
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly ILogger<FriendRequestDeclinedNotificationHandler> _logger;

    public FriendRequestDeclinedNotificationHandler(
        IRealtimeNotifier realtimeNotifier,
        ILogger<FriendRequestDeclinedNotificationHandler> logger)
    {
        _realtimeNotifier = realtimeNotifier;
        _logger = logger;
    }

    public async Task Handle(FriendRequestDeclinedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _realtimeNotifier.SendFriendRequestDeclinedAsync(notification.OriginalSenderId, new
            {
                requestId = notification.RequestId,
                declinerId = notification.DeclinerId,
                declinerName = notification.DeclinerName,
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send real-time declined notification for friend request {RequestId}",
                notification.RequestId);
        }
    }
}
