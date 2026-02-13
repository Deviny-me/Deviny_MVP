using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Messages.Queries;

/// <summary>
/// Get user IDs of all members in a conversation.
/// </summary>
public record GetConversationMembersQuery(Guid ConversationId) : IRequest<List<Guid>>;

public class GetConversationMembersQueryHandler : IRequestHandler<GetConversationMembersQuery, List<Guid>>
{
    private readonly IConversationRepository _conversationRepository;

    public GetConversationMembersQueryHandler(IConversationRepository conversationRepository)
    {
        _conversationRepository = conversationRepository;
    }

    public async Task<List<Guid>> Handle(GetConversationMembersQuery request, CancellationToken cancellationToken)
    {
        return await _conversationRepository.GetMemberIdsAsync(request.ConversationId, cancellationToken);
    }
}
