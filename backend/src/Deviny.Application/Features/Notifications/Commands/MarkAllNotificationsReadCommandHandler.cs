using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Notifications.Commands;

public class MarkAllNotificationsReadCommandHandler
    : IRequestHandler<MarkAllNotificationsReadCommand, int>
{
    private readonly INotificationRepository _notificationRepository;

    public MarkAllNotificationsReadCommandHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<int> Handle(
        MarkAllNotificationsReadCommand request,
        CancellationToken cancellationToken)
    {
        return await _notificationRepository.MarkAllAsReadAsync(
            request.UserId, cancellationToken);
    }
}
