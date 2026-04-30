using MediatR;

namespace Deviny.Application.Features.Notifications.Commands;

public class DeleteNotificationCommand : IRequest<bool>
{
    public required Guid NotificationId { get; set; }
    public required Guid UserId { get; set; }
}
