using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Messages.Queries;

public record GetMyConversationsQuery(Guid UserId) : IRequest<List<ConversationListItemDto>>;

public class GetMyConversationsQueryHandler : IRequestHandler<GetMyConversationsQuery, List<ConversationListItemDto>>
{
    private readonly IConversationRepository _conversationRepository;
    private readonly IMessageRepository _messageRepository;

    public GetMyConversationsQueryHandler(
        IConversationRepository conversationRepository,
        IMessageRepository messageRepository)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
    }

    public async Task<List<ConversationListItemDto>> Handle(GetMyConversationsQuery request, CancellationToken cancellationToken)
    {
        var conversations = await _conversationRepository.GetUserConversationsAsync(request.UserId, cancellationToken);

        var result = new List<ConversationListItemDto>();

        foreach (var conv in conversations)
        {
            // Find the OTHER member (not the requesting user)
            var peerMember = conv.Members.FirstOrDefault(m => m.UserId != request.UserId);
            if (peerMember?.User == null) continue;

            var lastMessage = conv.Messages
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefault();

            var unreadCount = await _messageRepository.CountUnreadAsync(conv.Id, request.UserId, cancellationToken);

            result.Add(new ConversationListItemDto
            {
                Id = conv.Id,
                PeerUser = new PeerUserDto
                {
                    Id = peerMember.User.Id,
                    FullName = peerMember.User.FullName,
                    AvatarUrl = peerMember.User.AvatarUrl,
                    Role = peerMember.User.Role.ToString()
                },
                LastMessageText = lastMessage?.Text,
                LastMessageAt = lastMessage?.CreatedAt,
                UnreadCount = unreadCount
            });
        }

        return result;
    }
}
