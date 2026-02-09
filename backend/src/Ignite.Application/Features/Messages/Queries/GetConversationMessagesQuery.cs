using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Messages.Commands;
using MediatR;

namespace Ignite.Application.Features.Messages.Queries;

/// <summary>
/// Cursor-based pagination: pass null cursor for the first page; for subsequent pages
/// pass the CreatedAt of the oldest message you already have.
/// </summary>
public record GetConversationMessagesQuery(
    Guid UserId,
    Guid ConversationId,
    DateTime? Cursor = null,
    int PageSize = 50) : IRequest<List<MessageDto>>;

public class GetConversationMessagesQueryHandler : IRequestHandler<GetConversationMessagesQuery, List<MessageDto>>
{
    private readonly IConversationRepository _conversationRepository;
    private readonly IMessageRepository _messageRepository;

    public GetConversationMessagesQueryHandler(
        IConversationRepository conversationRepository,
        IMessageRepository messageRepository)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
    }

    public async Task<List<MessageDto>> Handle(GetConversationMessagesQuery request, CancellationToken cancellationToken)
    {
        // Verify membership
        var isMember = await _conversationRepository.IsMemberAsync(request.ConversationId, request.UserId, cancellationToken);
        if (!isMember)
            throw new UnauthorizedAccessException("You are not part of this conversation");

        var messages = await _messageRepository.GetByConversationAsync(
            request.ConversationId,
            request.Cursor,
            request.PageSize,
            cancellationToken);

        return messages.Select(SendMessageCommandHandler.MapToDto).ToList();
    }
}
