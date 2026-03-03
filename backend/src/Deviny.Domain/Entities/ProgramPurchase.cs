using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class ProgramPurchase : BaseEntity
{
    public Guid? TrainingProgramId { get; set; }
    public Guid? MealProgramId { get; set; }
    public Guid UserId { get; set; }
    public DateTime PurchasedAt { get; set; }
    public ProgramPurchaseStatus Status { get; set; }
    public ProgramTier Tier { get; set; }
    public ProgramType ProgramType { get; set; }

    // Navigation properties
    public TrainingProgram? TrainingProgram { get; set; }
    public MealProgram? MealProgram { get; set; }
    public User User { get; set; } = null!;
}
