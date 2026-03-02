using MediatR;

namespace Deviny.Application.Features.Notifications.Events;

public class NewFollowerEvent : INotification
{
    public required Guid FollowerId { get; set; }
    public required string FollowerName { get; set; }
    public required string? FollowerAvatar { get; set; }
    public required Guid TrainerId { get; set; }
}
