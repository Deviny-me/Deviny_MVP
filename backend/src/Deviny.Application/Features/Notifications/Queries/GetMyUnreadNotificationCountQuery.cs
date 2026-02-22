using MediatR;

namespace Deviny.Application.Features.Notifications.Queries;

public class GetMyUnreadNotificationCountQuery : IRequest<int>
{
    public required Guid UserId { get; set; }
}
