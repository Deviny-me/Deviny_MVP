using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Deviny.Application.Features.Notifications.Events;

public class AchievementAwardedNotificationHandler : INotificationHandler<AchievementAwardedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IUserFollowRepository _userFollowRepository;
    private readonly IFriendRequestRepository _friendRequestRepository;
    private readonly IProgramPurchaseRepository _programPurchaseRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<AchievementAwardedNotificationHandler> _logger;

    public AchievementAwardedNotificationHandler(
        INotificationService notificationService,
        IUserFollowRepository userFollowRepository,
        IFriendRequestRepository friendRequestRepository,
        IProgramPurchaseRepository programPurchaseRepository,
        IUserRepository userRepository,
        ILogger<AchievementAwardedNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _userFollowRepository = userFollowRepository;
        _friendRequestRepository = friendRequestRepository;
        _programPurchaseRepository = programPurchaseRepository;
        _userRepository = userRepository;
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

            var actor = await _userRepository.GetByIdAsync(notification.UserId);
            var actorName = actor?.FullName ?? "A user";

            var followerIds = await _userFollowRepository.GetFollowerIdsAsync(notification.UserId, cancellationToken);
            var friendIds = (await _friendRequestRepository.GetFriendsAsync(notification.UserId))
                .Select(x => x.Friend.Id)
                .ToList();
            var buyerIds = await _programPurchaseRepository.GetBuyerIdsByTrainerAsync(notification.UserId);

            var feedRecipientIds = followerIds
                .Concat(friendIds)
                .Concat(buyerIds)
                .Where(id => id != notification.UserId)
                .Distinct()
                .ToList();

            if (feedRecipientIds.Count > 0)
            {
                await _notificationService.CreateForManyAsync(
                    feedRecipientIds,
                    NotificationType.AchievementUnlocked,
                    "New achievement unlocked",
                    $"{actorName} unlocked: {notification.AchievementTitle}",
                    "Achievement",
                    notification.AchievementId,
                    cancellationToken);
            }

            _logger.LogInformation(
                "Achievement notifications created for {AchievementTitle}: user {UserId}, feed recipients {RecipientCount}",
                notification.AchievementTitle, notification.UserId, feedRecipientIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to create notification for achievement {AchievementTitle}",
                notification.AchievementTitle);
        }
    }
}
