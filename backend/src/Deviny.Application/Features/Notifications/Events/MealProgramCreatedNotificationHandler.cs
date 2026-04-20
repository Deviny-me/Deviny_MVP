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
    private readonly IFriendRequestRepository _friendRequestRepository;
    private readonly IProgramPurchaseRepository _programPurchaseRepository;
    private readonly ILogger<MealProgramCreatedNotificationHandler> _logger;

    public MealProgramCreatedNotificationHandler(
        INotificationService notificationService,
        IUserFollowRepository userFollowRepository,
        IFriendRequestRepository friendRequestRepository,
        IProgramPurchaseRepository programPurchaseRepository,
        ILogger<MealProgramCreatedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _userFollowRepository = userFollowRepository;
        _friendRequestRepository = friendRequestRepository;
        _programPurchaseRepository = programPurchaseRepository;
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
                    NotificationType.MealProgramCreated,
                    "Новая программа питания!",
                    $"{notification.TrainerName} создал новую программу питания: {notification.ProgramTitle}",
                    "MealProgram",
                    notification.ProgramId,
                    cancellationToken);
            }

            _logger.LogInformation(
                "Notifications created for meal program {ProgramTitle} (trainer + {RecipientCount} recipients)",
                notification.ProgramTitle, recipientIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to create notifications for meal program {ProgramTitle}",
                notification.ProgramTitle);
        }
    }
}
