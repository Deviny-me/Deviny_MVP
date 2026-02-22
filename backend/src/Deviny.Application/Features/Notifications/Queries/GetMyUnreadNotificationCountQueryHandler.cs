using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Notifications.Queries;

public class GetMyUnreadNotificationCountQueryHandler
    : IRequestHandler<GetMyUnreadNotificationCountQuery, int>
{
    private readonly INotificationRepository _notificationRepository;

    public GetMyUnreadNotificationCountQueryHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<int> Handle(
        GetMyUnreadNotificationCountQuery request,
        CancellationToken cancellationToken)
    {
        return await _notificationRepository.GetUnreadCountAsync(request.UserId, cancellationToken);
    }
}
