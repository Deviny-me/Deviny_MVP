using MediatR;

namespace Deviny.Application.Features.Notifications.Commands;

public class MarkAllNotificationsReadCommand : IRequest<int>
{
    public required Guid UserId { get; set; }
}
