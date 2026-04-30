using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Notifications.Commands;

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, bool>
{
    private readonly INotificationRepository _notificationRepository;

    public DeleteNotificationCommandHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<bool> Handle(
        DeleteNotificationCommand request,
        CancellationToken cancellationToken)
    {
        return await _notificationRepository.DeleteAsync(
            request.NotificationId, request.UserId, cancellationToken);
    }
}
