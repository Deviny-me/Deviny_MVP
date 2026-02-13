namespace Deviny.Domain.Entities;

public class TrainerCertificate : BaseEntity
{
    public required Guid TrainerId { get; set; }
    public TrainerProfile Trainer { get; set; } = null!;
    
    public required string Title { get; set; } = string.Empty;
    public string? Issuer { get; set; }
    public required int Year { get; set; }
    public int SortOrder { get; set; } = 0;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
}
