using Deviny.Application.Features.Notifications.DTOs;
using MediatR;

namespace Deviny.Application.Features.Notifications.Queries;

public class GetMyNotificationsQuery : IRequest<NotificationsResponse>
{
    public required Guid UserId { get; set; }
    public DateTime? Cursor { get; set; }
    public int Limit { get; set; } = 50;
}
