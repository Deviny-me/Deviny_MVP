using MediatR;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRequestAcceptedEvent : INotification
{
    public required int RequestId { get; set; }
    public required Guid AcceptorId { get; set; }
    public required string AcceptorName { get; set; }
    public required string? AcceptorAvatar { get; set; }
    public required Guid OriginalSenderId { get; set; }
}
