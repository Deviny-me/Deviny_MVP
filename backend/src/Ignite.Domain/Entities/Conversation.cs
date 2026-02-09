using Ignite.Domain.Enums;

namespace Ignite.Domain.Entities;

public class Conversation
{
    public Guid Id { get; set; }
    public ConversationType Type { get; set; } = ConversationType.Direct;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<ConversationMember> Members { get; set; } = new List<ConversationMember>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
