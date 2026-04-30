using MediatR;

namespace Deviny.Application.Features.Notifications.Commands;

public class DeleteAllNotificationsCommand : IRequest<int>
{
    public required Guid UserId { get; set; }
}
