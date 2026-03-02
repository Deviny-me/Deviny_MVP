using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class NewFollowerNotificationHandler : INotificationHandler<NewFollowerEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NewFollowerNotificationHandler> _logger;

    public NewFollowerNotificationHandler(
        INotificationService notificationService,
        ILogger<NewFollowerNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(NewFollowerEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(
                notification.TrainerId,
                NotificationType.NewFollower,
                "New Follower",
                $"{notification.FollowerName} started following you",
                "User",
                notification.FollowerId,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create notification for new follower {FollowerId} of trainer {TrainerId}",
                notification.FollowerId, notification.TrainerId);
        }
    }
}
