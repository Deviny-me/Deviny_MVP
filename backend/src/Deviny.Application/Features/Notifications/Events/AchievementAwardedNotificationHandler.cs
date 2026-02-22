using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class AchievementAwardedNotificationHandler : INotificationHandler<AchievementAwardedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<AchievementAwardedNotificationHandler> _logger;

    public AchievementAwardedNotificationHandler(
        INotificationService notificationService,
        ILogger<AchievementAwardedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(AchievementAwardedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(
                notification.UserId,
                NotificationType.AchievementUnlocked,
                "Достижение разблокировано!",
                $"Вы получили: {notification.AchievementTitle}",
                "Achievement",
                notification.AchievementId,
                cancellationToken);

            _logger.LogInformation(
                "Notification created for achievement {AchievementTitle} awarded to user {UserId}",
                notification.AchievementTitle, notification.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to create notification for achievement {AchievementTitle}",
                notification.AchievementTitle);
        }
    }
}
