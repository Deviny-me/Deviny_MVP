using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRequestReceivedNotificationHandler : INotificationHandler<FriendRequestReceivedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly ILogger<FriendRequestReceivedNotificationHandler> _logger;

    public FriendRequestReceivedNotificationHandler(
        INotificationService notificationService,
        IRealtimeNotifier realtimeNotifier,
        ILogger<FriendRequestReceivedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _realtimeNotifier = realtimeNotifier;
        _logger = logger;
    }

    public async Task Handle(FriendRequestReceivedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(
                notification.ReceiverId,
                NotificationType.FriendRequestReceived,
                "New Friend Request",
                $"{notification.SenderName} sent you a friend request",
                "FriendRequest",
                null,
                cancellationToken);

            // Send specific friend request event for real-time UI updates
            await _realtimeNotifier.SendFriendRequestReceivedAsync(notification.ReceiverId, new
            {
                requestId = notification.RequestId,
                senderId = notification.SenderId,
                senderName = notification.SenderName,
                senderAvatar = notification.SenderAvatar
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create notification for friend request from {SenderId} to {ReceiverId}",
                notification.SenderId, notification.ReceiverId);
        }
    }
}
