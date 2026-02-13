using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Repositories;

public class ConversationRepository : IConversationRepository
{
    private readonly ApplicationDbContext _context;

    public ConversationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Conversation?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Conversations
            .Include(c => c.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<Conversation> GetOrCreateDirectAsync(Guid userA, Guid userB, CancellationToken ct = default)
    {
        // Normalize order to prevent race conditions with reversed pairs
        var (first, second) = userA.CompareTo(userB) <= 0 ? (userA, userB) : (userB, userA);

        // Find an existing direct conversation that has BOTH users as members
        var conversation = await _context.Conversations
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Where(c => c.Type == ConversationType.Direct)
            .Where(c => c.Members.Any(m => m.UserId == first) &&
                        c.Members.Any(m => m.UserId == second))
            .FirstOrDefaultAsync(ct);

        if (conversation != null)
            return conversation;

        // Create new conversation with members
        var now = DateTime.UtcNow;
        conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            Type = ConversationType.Direct,
            CreatedAt = now,
            UpdatedAt = now
        };

        conversation.Members.Add(new ConversationMember
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            UserId = first,
            JoinedAt = now
        });
        conversation.Members.Add(new ConversationMember
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            UserId = second,
            JoinedAt = now
        });

        _context.Conversations.Add(conversation);

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Race condition: another request created the conversation simultaneously.
            // Detach the failed entity and re-query.
            _context.Entry(conversation).State = EntityState.Detached;
            foreach (var member in conversation.Members)
                _context.Entry(member).State = EntityState.Detached;

            conversation = await _context.Conversations
                .Include(c => c.Members).ThenInclude(m => m.User)
                .Where(c => c.Type == ConversationType.Direct)
                .Where(c => c.Members.Any(m => m.UserId == first) &&
                            c.Members.Any(m => m.UserId == second))
                .FirstOrDefaultAsync(ct);

            if (conversation != null)
                return conversation;

            throw; // Truly unexpected error
        }

        // Reload with User navigation
        await _context.Entry(conversation).Collection(c => c.Members).Query()
            .Include(m => m.User).LoadAsync(ct);

        return conversation;
    }

    public async Task<bool> IsMemberAsync(Guid conversationId, Guid userId, CancellationToken ct = default)
    {
        return await _context.ConversationMembers
            .AnyAsync(m => m.ConversationId == conversationId && m.UserId == userId, ct);
    }

    public async Task<List<Conversation>> GetUserConversationsAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Messages.OrderByDescending(msg => msg.CreatedAt).Take(1))
                .ThenInclude(msg => msg.Sender)
            .Where(c => c.Members.Any(m => m.UserId == userId))
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(ct);
    }

    public async Task<List<Guid>> GetMemberIdsAsync(Guid conversationId, CancellationToken ct = default)
    {
        return await _context.ConversationMembers
            .Where(m => m.ConversationId == conversationId)
            .Select(m => m.UserId)
            .ToListAsync(ct);
    }

    public async Task UpdateAsync(Conversation conversation, CancellationToken ct = default)
    {
        _context.Conversations.Update(conversation);
        await _context.SaveChangesAsync(ct);
    }
}
