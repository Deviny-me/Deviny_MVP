using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class TrainingProgram : BaseEntity
{
    public Guid TrainerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public ProgramCategory Category { get; set; } = ProgramCategory.Training;
    public string Code { get; set; } = string.Empty;
    public string CoverImagePath { get; set; } = string.Empty;
    public string TrainingVideosPath { get; set; } = string.Empty; // JSON array of video paths
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public User Trainer { get; set; } = null!;
    public ICollection<ProgramPurchase> Purchases { get; set; } = new List<ProgramPurchase>();
    public ICollection<ProgramReview> Reviews { get; set; } = new List<ProgramReview>();
}
