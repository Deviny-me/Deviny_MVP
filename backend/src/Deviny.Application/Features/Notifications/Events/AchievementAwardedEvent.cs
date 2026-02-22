using MediatR;

namespace Deviny.Application.Features.Notifications.Events;

public class AchievementAwardedEvent : INotification
{
    public required Guid UserId { get; set; }
    public required Guid AchievementId { get; set; }
    public required string AchievementTitle { get; set; }
    public string? AchievementIconKey { get; set; }
}
