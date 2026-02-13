namespace Deviny.Domain.Entities;

public class TrainerAchievement : BaseEntity
{
    public required Guid TrainerId { get; set; }
    public TrainerProfile Trainer { get; set; } = null!;
    
    public required string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public required string IconKey { get; set; } = "trophy";
    public required string Tone { get; set; } = "yellow";
    public int SortOrder { get; set; } = 0;
}
