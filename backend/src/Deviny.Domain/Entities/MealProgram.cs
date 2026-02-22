namespace Deviny.Domain.Entities;

public class MealProgram : BaseEntity
{
    public Guid TrainerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public string Code { get; set; } = string.Empty;
    public string CoverImagePath { get; set; } = string.Empty;
    public string VideosPath { get; set; } = string.Empty; // JSON array of video paths
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public User Trainer { get; set; } = null!;
}
