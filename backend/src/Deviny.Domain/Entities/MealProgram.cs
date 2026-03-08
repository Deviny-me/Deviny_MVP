using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class MealProgram : BaseEntity
{
    public Guid TrainerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? StandardPrice { get; set; }
    public decimal? ProPrice { get; set; }
    public int? MaxStandardSpots { get; set; }
    public int? MaxProSpots { get; set; }
    public ProgramCategory Category { get; set; } = ProgramCategory.Diet;
    public string Code { get; set; } = string.Empty;
    public string CoverImagePath { get; set; } = string.Empty;
    public string VideosPath { get; set; } = string.Empty; // JSON array of video paths
    public bool IsPublic { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public User Trainer { get; set; } = null!;
    public ICollection<ProgramPurchase> Purchases { get; set; } = new List<ProgramPurchase>();
    public ICollection<ProgramReview> Reviews { get; set; } = new List<ProgramReview>();
}
