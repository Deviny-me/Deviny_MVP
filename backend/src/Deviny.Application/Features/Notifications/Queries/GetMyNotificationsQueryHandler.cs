using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Notifications.DTOs;
using MediatR;

namespace Deviny.Application.Features.Notifications.Queries;

public class GetMyNotificationsQueryHandler : IRequestHandler<GetMyNotificationsQuery, NotificationsResponse>
{
    private readonly INotificationRepository _notificationRepository;

    public GetMyNotificationsQueryHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<NotificationsResponse> Handle(
        GetMyNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var limit = Math.Clamp(request.Limit, 1, 100);

        var notifications = await _notificationRepository.GetByUserIdAsync(
            request.UserId, request.Cursor, limit, cancellationToken);

        var unreadCount = await _notificationRepository.GetUnreadCountAsync(
            request.UserId, cancellationToken);

        var items = notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type.ToString(),
            Title = n.Title,
            Message = n.Message,
            RelatedEntityType = n.RelatedEntityType,
            RelatedEntityId = n.RelatedEntityId,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            ReadAt = n.ReadAt
        }).ToList();

        var nextCursor = items.Count == limit ? items.Last().CreatedAt : (DateTime?)null;

        return new NotificationsResponse
        {
            Items = items,
            UnreadCount = unreadCount,
            NextCursor = nextCursor
        };
    }
}
