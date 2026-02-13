using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IConversationRepository
{
    Task<Conversation?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Returns an existing direct conversation between two users, or creates one
    /// (with two ConversationMember rows) and returns it.
    /// Includes Members→User navigation.
    /// </summary>
    Task<Conversation> GetOrCreateDirectAsync(Guid userA, Guid userB, CancellationToken ct = default);

    /// <summary>
    /// Is the user a member of this conversation?
    /// </summary>
    Task<bool> IsMemberAsync(Guid conversationId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Returns conversations the user belongs to, ordered by UpdatedAt desc.
    /// Includes Members→User, and last message (via a subquery).
    /// </summary>
    Task<List<Conversation>> GetUserConversationsAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Get list of member user IDs in a conversation.
    /// </summary>
    Task<List<Guid>> GetMemberIdsAsync(Guid conversationId, CancellationToken ct = default);

    Task UpdateAsync(Conversation conversation, CancellationToken ct = default);
}
