using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Notifications.Commands;

public class DeleteAllNotificationsCommandHandler
    : IRequestHandler<DeleteAllNotificationsCommand, int>
{
    private readonly INotificationRepository _notificationRepository;

    public DeleteAllNotificationsCommandHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<int> Handle(
        DeleteAllNotificationsCommand request,
        CancellationToken cancellationToken)
    {
        return await _notificationRepository.DeleteAllAsync(
            request.UserId, cancellationToken);
    }
}
