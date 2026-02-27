using MediatR;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRemovedEvent : INotification
{
    public required Guid RemovedByUserId { get; set; }
    public required string RemovedByName { get; set; }
    public required Guid RemovedFriendId { get; set; }
}
