using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using Ignite.Domain.Enums;
using Ignite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ignite.Infrastructure.Repositories;

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
        // Find an existing direct conversation that has BOTH users as members
        var conversation = await _context.Conversations
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Where(c => c.Type == ConversationType.Direct)
            .Where(c => c.Members.Any(m => m.UserId == userA) &&
                        c.Members.Any(m => m.UserId == userB))
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
            UserId = userA,
            JoinedAt = now
        });
        conversation.Members.Add(new ConversationMember
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            UserId = userB,
            JoinedAt = now
        });

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync(ct);

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
