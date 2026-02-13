using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class MessageRepository : IMessageRepository
{
    private readonly ApplicationDbContext _context;

    public MessageRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Message> AddAsync(Message message, CancellationToken ct = default)
    {
        _context.Messages.Add(message);
        await _context.SaveChangesAsync(ct);

        // Reload with navigations
        await _context.Entry(message).Reference(m => m.Sender).LoadAsync(ct);
        if (message.ReplyToMessageId.HasValue)
        {
            await _context.Entry(message).Reference(m => m.ReplyToMessage).LoadAsync(ct);
            if (message.ReplyToMessage != null)
                await _context.Entry(message.ReplyToMessage).Reference(m => m.Sender).LoadAsync(ct);
        }

        return message;
    }

    public async Task<Message?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.ReplyToMessage).ThenInclude(r => r!.Sender)
            .FirstOrDefaultAsync(m => m.Id == id, ct);
    }

    public async Task<List<Message>> GetByConversationAsync(
        Guid conversationId,
        DateTime? cursor,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.ReplyToMessage).ThenInclude(r => r!.Sender)
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted);

        if (cursor.HasValue)
            query = query.Where(m => m.CreatedAt < cursor.Value);

        // Newest first for paging, then reverse on client
        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(pageSize)
            .ToListAsync(ct);

        // Return in chronological order
        messages.Reverse();
        return messages;
    }

    public async Task<List<Guid>> MarkAsReadAsync(Guid conversationId, Guid userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var unread = await _context.Messages
            .Where(m => m.ConversationId == conversationId &&
                        m.SenderId != userId &&
                        m.ReadAt == null &&
                        !m.IsDeleted)
            .ToListAsync(ct);

        if (unread.Count == 0)
            return new List<Guid>();

        var ids = new List<Guid>(unread.Count);
        foreach (var msg in unread)
        {
            msg.ReadAt = now;
            ids.Add(msg.Id);
        }

        await _context.SaveChangesAsync(ct);
        return ids;
    }

    public async Task<int> CountUnreadAsync(Guid conversationId, Guid userId, CancellationToken ct = default)
    {
        return await _context.Messages
            .CountAsync(m => m.ConversationId == conversationId &&
                            m.SenderId != userId &&
                            m.ReadAt == null &&
                            !m.IsDeleted, ct);
    }

    public async Task<int> GetUnreadCountForUserAsync(Guid userId, CancellationToken ct = default)
    {
        // Get all conversation IDs where user is a member
        var conversationIds = await _context.ConversationMembers
            .Where(cm => cm.UserId == userId)
            .Select(cm => cm.ConversationId)
            .ToListAsync(ct);

        if (conversationIds.Count == 0)
            return 0;

        // Count all unread messages in those conversations (not sent by this user)
        return await _context.Messages
            .CountAsync(m => conversationIds.Contains(m.ConversationId) &&
                            m.SenderId != userId &&
                            m.ReadAt == null &&
                            !m.IsDeleted, ct);
    }
}
