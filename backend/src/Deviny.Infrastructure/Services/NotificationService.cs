using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Deviny.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        IRealtimeNotifier realtimeNotifier,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _realtimeNotifier = realtimeNotifier;
        _logger = logger;
    }

    public async Task<Notification> CreateAsync(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId,
            IsRead = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        var saved = await _notificationRepository.AddAsync(notification, ct);

        // Push real-time notification
        try
        {
            await _realtimeNotifier.SendNotificationAsync(userId, new
            {
                id = saved.Id,
                type = saved.Type.ToString(),
                title = saved.Title,
                message = saved.Message,
                relatedEntityType = saved.RelatedEntityType,
                relatedEntityId = saved.RelatedEntityId,
                isRead = false,
                createdAt = saved.CreatedAt
            }, ct);

            var unreadCount = await _notificationRepository.GetUnreadCountAsync(userId, ct);
            await _realtimeNotifier.SendUnreadCountAsync(userId, unreadCount, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push real-time notification to user {UserId}", userId);
        }

        return saved;
    }

    public async Task CreateForManyAsync(
        List<Guid> userIds,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        CancellationToken ct = default)
    {
        if (userIds.Count == 0) return;

        var now = DateTime.UtcNow;

        var notifications = userIds.Select(userId => new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId,
            IsRead = false,
            CreatedAt = now,
            UpdatedAt = now
        }).ToList();

        await _notificationRepository.AddRangeAsync(notifications, ct);

        // Push real-time notifications to each user
        // Pre-fetch unread counts per unique user to avoid N+1 queries
        var uniqueUserIds = notifications.Select(n => n.UserId).Distinct().ToList();
        var unreadCounts = new Dictionary<Guid, int>();
        try
        {
            foreach (var uid in uniqueUserIds)
            {
                unreadCounts[uid] = await _notificationRepository.GetUnreadCountAsync(uid, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to pre-fetch unread counts");
        }

        // Send notifications in parallel per user
        var sendTasks = notifications.Select(async notification =>
        {
            try
            {
                await _realtimeNotifier.SendNotificationAsync(notification.UserId, new
                {
                    id = notification.Id,
                    type = notification.Type.ToString(),
                    title = notification.Title,
                    message = notification.Message,
                    relatedEntityType = notification.RelatedEntityType,
                    relatedEntityId = notification.RelatedEntityId,
                    isRead = false,
                    createdAt = notification.CreatedAt
                }, ct);

                if (unreadCounts.TryGetValue(notification.UserId, out var count))
                {
                    await _realtimeNotifier.SendUnreadCountAsync(notification.UserId, count, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to push real-time notification to user {UserId}", notification.UserId);
            }
        });

        await Task.WhenAll(sendTasks);

        _logger.LogInformation(
            "Created {Count} notifications of type {Type} for entity {EntityType}:{EntityId}",
            notifications.Count, type, relatedEntityType, relatedEntityId);
    }
}
