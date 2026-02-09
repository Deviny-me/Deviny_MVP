using Ignite.Application.Common.Interfaces;
using MediatR;

namespace Ignite.Application.Features.Messages.Queries;

/// <summary>
/// Returns the conversation ID for a direct DM between current user and otherUserId.
/// Creates the conversation + membership rows if they don't exist.
/// </summary>
public record GetOrCreateConversationQuery(Guid UserId, Guid OtherUserId) : IRequest<Guid>;

public class GetOrCreateConversationQueryHandler : IRequestHandler<GetOrCreateConversationQuery, Guid>
{
    private readonly IConversationRepository _conversationRepository;
    private readonly IUserRepository _userRepository;

    public GetOrCreateConversationQueryHandler(
        IConversationRepository conversationRepository,
        IUserRepository userRepository)
    {
        _conversationRepository = conversationRepository;
        _userRepository = userRepository;
    }

    public async Task<Guid> Handle(GetOrCreateConversationQuery request, CancellationToken cancellationToken)
    {
        // Verify other user exists
        var otherUser = await _userRepository.GetByIdAsync(request.OtherUserId);
        if (otherUser == null)
            throw new Exception("User not found");

        var conversation = await _conversationRepository.GetOrCreateDirectAsync(
            request.UserId, request.OtherUserId, cancellationToken);

        return conversation.Id;
    }
}
