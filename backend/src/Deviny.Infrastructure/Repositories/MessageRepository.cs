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

        // First get the IDs we'll update (for SignalR notifications)
        var ids = await _context.Messages
            .Where(m => m.ConversationId == conversationId &&
                        m.SenderId != userId &&
                        m.ReadAt == null &&
                        !m.IsDeleted)
            .Select(m => m.Id)
            .ToListAsync(ct);

        if (ids.Count == 0)
            return new List<Guid>();

        // Bulk update without loading entities into memory
        await _context.Messages
            .Where(m => ids.Contains(m.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.ReadAt, now), ct);

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
        // Single query with subquery instead of two round-trips
        return await _context.Messages
            .CountAsync(m =>
                _context.ConversationMembers.Any(cm => cm.UserId == userId && cm.ConversationId == m.ConversationId) &&
                m.SenderId != userId &&
                m.ReadAt == null &&
                !m.IsDeleted, ct);
    }
}
