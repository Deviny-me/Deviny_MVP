using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRequestAcceptedNotificationHandler : INotificationHandler<FriendRequestAcceptedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly ILogger<FriendRequestAcceptedNotificationHandler> _logger;

    public FriendRequestAcceptedNotificationHandler(
        INotificationService notificationService,
        IRealtimeNotifier realtimeNotifier,
        ILogger<FriendRequestAcceptedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _realtimeNotifier = realtimeNotifier;
        _logger = logger;
    }

    public async Task Handle(FriendRequestAcceptedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(
                notification.OriginalSenderId,
                NotificationType.FriendRequestAccepted,
                "Friend Request Accepted",
                $"{notification.AcceptorName} accepted your friend request",
                "FriendRequest",
                null,
                cancellationToken);

            // Send specific friend request accepted event for real-time UI updates
            await _realtimeNotifier.SendFriendRequestAcceptedAsync(notification.OriginalSenderId, new
            {
                requestId = notification.RequestId,
                acceptorId = notification.AcceptorId,
                acceptorName = notification.AcceptorName,
                acceptorAvatar = notification.AcceptorAvatar
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create notification for accepted friend request {RequestId}",
                notification.RequestId);
        }
    }
}
