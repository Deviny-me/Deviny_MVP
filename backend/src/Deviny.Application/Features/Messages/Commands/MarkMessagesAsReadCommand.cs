using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Messages.Commands;

public record MarkMessagesAsReadCommand(Guid UserId, Guid ConversationId) : IRequest<List<Guid>>;

public class MarkMessagesAsReadCommandHandler : IRequestHandler<MarkMessagesAsReadCommand, List<Guid>>
{
    private readonly IConversationRepository _conversationRepository;
    private readonly IMessageRepository _messageRepository;

    public MarkMessagesAsReadCommandHandler(
        IConversationRepository conversationRepository,
        IMessageRepository messageRepository)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
    }

    public async Task<List<Guid>> Handle(MarkMessagesAsReadCommand request, CancellationToken cancellationToken)
    {
        var isMember = await _conversationRepository.IsMemberAsync(request.ConversationId, request.UserId, cancellationToken);
        if (!isMember)
            throw new UnauthorizedAccessException("You are not a member of this conversation");

        return await _messageRepository.MarkAsReadAsync(request.ConversationId, request.UserId, cancellationToken);
    }
}
