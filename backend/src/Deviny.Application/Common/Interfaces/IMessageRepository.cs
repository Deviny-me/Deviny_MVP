using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

public interface IMessageRepository
{
    Task<Message> AddAsync(Message message, CancellationToken ct = default);

    Task<Message?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Cursor-based: returns messages older than the cursor, ordered newest→oldest, limited by pageSize.
    /// Includes Sender and ReplyToMessage→Sender navigations.
    /// </summary>
    Task<List<Message>> GetByConversationAsync(
        Guid conversationId,
        DateTime? cursor,
        int pageSize,
        CancellationToken ct = default);

    /// <summary>
    /// Marks all messages NOT sent by userId in the conversation as read.
    /// Returns the list of message IDs that were actually updated.
    /// </summary>
    Task<List<Guid>> MarkAsReadAsync(Guid conversationId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Count of unread messages in a conversation for the given user.
    /// </summary>
    Task<int> CountUnreadAsync(Guid conversationId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Get total unread messages count across ALL conversations for the given user.
    /// Server-authoritative count for global badge.
    /// </summary>
    Task<int> GetUnreadCountForUserAsync(Guid userId, CancellationToken ct = default);
}
