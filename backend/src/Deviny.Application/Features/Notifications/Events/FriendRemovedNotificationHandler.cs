using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRemovedNotificationHandler : INotificationHandler<FriendRemovedEvent>
{
    private readonly IRealtimeNotifier _realtimeNotifier;

    public FriendRemovedNotificationHandler(IRealtimeNotifier realtimeNotifier)
    {
        _realtimeNotifier = realtimeNotifier;
    }

    public async Task Handle(FriendRemovedEvent notification, CancellationToken cancellationToken)
    {
        // Notify the removed friend in real-time so their UI updates
        await _realtimeNotifier.SendFriendRemovedAsync(
            notification.RemovedFriendId,
            new
            {
                removedByUserId = notification.RemovedByUserId.ToString(),
                removedByName = notification.RemovedByName
            },
            cancellationToken);
    }
}
