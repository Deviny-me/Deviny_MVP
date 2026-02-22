using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Deviny.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
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

        return await _notificationRepository.AddAsync(notification, ct);
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

        _logger.LogInformation(
            "Created {Count} notifications of type {Type} for entity {EntityType}:{EntityId}",
            notifications.Count, type, relatedEntityType, relatedEntityId);
    }
}
