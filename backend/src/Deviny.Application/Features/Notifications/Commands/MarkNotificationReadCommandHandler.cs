using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Notifications.Commands;

public class MarkNotificationReadCommandHandler : IRequestHandler<MarkNotificationReadCommand, bool>
{
    private readonly INotificationRepository _notificationRepository;

    public MarkNotificationReadCommandHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<bool> Handle(
        MarkNotificationReadCommand request,
        CancellationToken cancellationToken)
    {
        return await _notificationRepository.MarkAsReadAsync(
            request.NotificationId, request.UserId, cancellationToken);
    }
}
