using MediatR;

namespace Deviny.Application.Features.Notifications.Events;

public class FriendRequestReceivedEvent : INotification
{
    public required int RequestId { get; set; }
    public required Guid SenderId { get; set; }
    public required string SenderName { get; set; }
    public required string? SenderAvatar { get; set; }
    public required Guid ReceiverId { get; set; }
}
