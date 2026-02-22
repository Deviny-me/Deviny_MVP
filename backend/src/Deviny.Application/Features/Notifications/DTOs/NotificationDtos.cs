namespace Deviny.Application.Features.Notifications.DTOs;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? RelatedEntityType { get; set; }
    public Guid? RelatedEntityId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

public class NotificationsResponse
{
    public List<NotificationDto> Items { get; set; } = new();
    public int UnreadCount { get; set; }
    public DateTime? NextCursor { get; set; }
}
