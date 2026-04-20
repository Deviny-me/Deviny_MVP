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
    private readonly IFriendRequestRepository _friendRequestRepository;
    private readonly IProgramPurchaseRepository _programPurchaseRepository;
    private readonly ILogger<TrainingProgramCreatedNotificationHandler> _logger;

    public TrainingProgramCreatedNotificationHandler(
        INotificationService notificationService,
        IUserFollowRepository userFollowRepository,
        IFriendRequestRepository friendRequestRepository,
        IProgramPurchaseRepository programPurchaseRepository,
        ILogger<TrainingProgramCreatedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _userFollowRepository = userFollowRepository;
        _friendRequestRepository = friendRequestRepository;
        _programPurchaseRepository = programPurchaseRepository;
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

            // 2. Notify subscribers/friends/customers
            var followerIds = await _userFollowRepository.GetFollowerIdsAsync(
                notification.TrainerId, cancellationToken);
            var friendIds = (await _friendRequestRepository.GetFriendsAsync(notification.TrainerId))
                .Select(x => x.Friend.Id)
                .ToList();
            var buyerIds = await _programPurchaseRepository.GetBuyerIdsByTrainerAsync(notification.TrainerId);

            var recipientIds = followerIds
                .Concat(friendIds)
                .Concat(buyerIds)
                .Where(id => id != notification.TrainerId)
                .Distinct()
                .ToList();

            if (recipientIds.Count > 0)
            {
                await _notificationService.CreateForManyAsync(
                    recipientIds,
                    NotificationType.TrainingProgramCreated,
                    "Новая программа тренировок!",
                    $"{notification.TrainerName} создал новую программу: {notification.ProgramTitle}",
                    "TrainingProgram",
                    notification.ProgramId,
                    cancellationToken);
            }

            _logger.LogInformation(
                "Notifications created for training program {ProgramTitle} (trainer + {RecipientCount} recipients)",
                notification.ProgramTitle, recipientIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to create notifications for training program {ProgramTitle}",
                notification.ProgramTitle);
        }
    }
}
