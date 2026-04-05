using MediatR;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRequestDeclinedEvent : INotification
{
    public required int RequestId { get; set; }
    public required Guid DeclinerId { get; set; }
    public required string DeclinerName { get; set; }
    public required Guid OriginalSenderId { get; set; }
}
