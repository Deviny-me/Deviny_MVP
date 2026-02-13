using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class XpTransaction : BaseEntity
{
    public Guid UserId { get; set; }
    public XpEventType EventType { get; set; }
    public int XpAmount { get; set; }
    public string IdempotencyKey { get; set; } = null!;
    public Guid? SourceEntityId { get; set; }
    
    // Navigation
    public User User { get; set; } = null!;
}
