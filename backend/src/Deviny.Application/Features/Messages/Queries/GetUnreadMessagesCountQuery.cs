using MediatR;
using Deviny.Application.Common.Interfaces;

namespace Deviny.Application.Features.Messages.Queries;

/// <summary>
/// Query to get total unread messages count for the current user.
/// </summary>
public record GetUnreadMessagesCountQuery(Guid UserId) : IRequest<int>;

public class GetUnreadMessagesCountQueryHandler : IRequestHandler<GetUnreadMessagesCountQuery, int>
{
    private readonly IMessageRepository _messageRepository;

    public GetUnreadMessagesCountQueryHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<int> Handle(GetUnreadMessagesCountQuery request, CancellationToken cancellationToken)
    {
        return await _messageRepository.GetUnreadCountForUserAsync(request.UserId, cancellationToken);
    }
}
