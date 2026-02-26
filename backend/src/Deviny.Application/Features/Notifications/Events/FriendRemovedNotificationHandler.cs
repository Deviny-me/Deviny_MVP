using Deviny.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRemovedNotificationHandler : INotificationHandler<FriendRemovedEvent>
{
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly ILogger<FriendRemovedNotificationHandler> _logger;

    public FriendRemovedNotificationHandler(
        IRealtimeNotifier realtimeNotifier,
        ILogger<FriendRemovedNotificationHandler> logger)
    {
        _realtimeNotifier = realtimeNotifier;
        _logger = logger;
    }

    public async Task Handle(FriendRemovedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _realtimeNotifier.SendFriendRemovedAsync(
                notification.RemovedFriendId,
                new
                {
                    removedByUserId = notification.RemovedByUserId.ToString(),
                    removedByName = notification.RemovedByName
                },
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to send FriendRemoved real-time notification to user {UserId}",
                notification.RemovedFriendId);
        }
    }
}
