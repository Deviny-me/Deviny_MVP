using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Messages.Queries;

public record GetMyConversationsQuery(Guid UserId, int Page = 1, int PageSize = 30) : IRequest<PagedResponse<ConversationListItemDto>>;

public class GetMyConversationsQueryHandler : IRequestHandler<GetMyConversationsQuery, PagedResponse<ConversationListItemDto>>
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

    public async Task<PagedResponse<ConversationListItemDto>> Handle(GetMyConversationsQuery request, CancellationToken cancellationToken)
    {
        var (conversations, totalCount) = await _conversationRepository.GetUserConversationsPagedAsync(
            request.UserId, request.Page, request.PageSize, cancellationToken);

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

        return new PagedResponse<ConversationListItemDto>(result, totalCount, request.Page, request.PageSize);
    }
}
