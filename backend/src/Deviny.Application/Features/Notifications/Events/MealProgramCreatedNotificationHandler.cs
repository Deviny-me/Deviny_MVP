using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class MealProgramCreatedNotificationHandler
    : INotificationHandler<MealProgramCreatedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IUserFollowRepository _userFollowRepository;
    private readonly ILogger<MealProgramCreatedNotificationHandler> _logger;

    public MealProgramCreatedNotificationHandler(
        INotificationService notificationService,
        IUserFollowRepository userFollowRepository,
        ILogger<MealProgramCreatedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _userFollowRepository = userFollowRepository;
        _logger = logger;
    }

    public async Task Handle(
        MealProgramCreatedEvent notification,
        CancellationToken cancellationToken)
    {
        try
        {
            // 1. Notify the trainer
            await _notificationService.CreateAsync(
                notification.TrainerId,
                NotificationType.MealProgramCreated,
                "Программа питания создана!",
                $"Вы создали программу питания: {notification.ProgramTitle}",
                "MealProgram",
                notification.ProgramId,
                cancellationToken);

            // 2. Notify all followers
            var followerIds = await _userFollowRepository.GetFollowerIdsAsync(
                notification.TrainerId, cancellationToken);

            if (followerIds.Count > 0)
            {
                await _notificationService.CreateForManyAsync(
                    followerIds,
                    NotificationType.MealProgramCreated,
                    "Новая программа питания!",
                    $"{notification.TrainerName} создал новую программу питания: {notification.ProgramTitle}",
                    "MealProgram",
                    notification.ProgramId,
                    cancellationToken);
            }

            _logger.LogInformation(
                "Notifications created for meal program {ProgramTitle} (trainer + {FollowerCount} followers)",
                notification.ProgramTitle, followerIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to create notifications for meal program {ProgramTitle}",
                notification.ProgramTitle);
        }
    }
}
