using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class TrainingProgramCreatedNotificationHandler
    : INotificationHandler<TrainingProgramCreatedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IUserFollowRepository _userFollowRepository;
    private readonly ILogger<TrainingProgramCreatedNotificationHandler> _logger;

    public TrainingProgramCreatedNotificationHandler(
        INotificationService notificationService,
        IUserFollowRepository userFollowRepository,
        ILogger<TrainingProgramCreatedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _userFollowRepository = userFollowRepository;
        _logger = logger;
    }

    public async Task Handle(
        TrainingProgramCreatedEvent notification,
        CancellationToken cancellationToken)
    {
        try
        {
            // 1. Notify the trainer
            await _notificationService.CreateAsync(
                notification.TrainerId,
                NotificationType.TrainingProgramCreated,
                "Программа создана!",
                $"Вы создали программу тренировок: {notification.ProgramTitle}",
                "TrainingProgram",
                notification.ProgramId,
                cancellationToken);

            // 2. Notify all followers
            var followerIds = await _userFollowRepository.GetFollowerIdsAsync(
                notification.TrainerId, cancellationToken);

            if (followerIds.Count > 0)
            {
                await _notificationService.CreateForManyAsync(
                    followerIds,
                    NotificationType.TrainingProgramCreated,
                    "Новая программа тренировок!",
                    $"{notification.TrainerName} создал новую программу: {notification.ProgramTitle}",
                    "TrainingProgram",
                    notification.ProgramId,
                    cancellationToken);
            }

            _logger.LogInformation(
                "Notifications created for training program {ProgramTitle} (trainer + {FollowerCount} followers)",
                notification.ProgramTitle, followerIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to create notifications for training program {ProgramTitle}",
                notification.ProgramTitle);
        }
    }
}
