using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class ProgramPurchase : BaseEntity
{
    public Guid ProgramId { get; set; }
    public Guid UserId { get; set; }
    public DateTime PurchasedAt { get; set; }
    public ProgramPurchaseStatus Status { get; set; }
    public ProgramTier Tier { get; set; }

    // Navigation properties
    public TrainingProgram Program { get; set; } = null!;
    public User User { get; set; } = null!;
}
