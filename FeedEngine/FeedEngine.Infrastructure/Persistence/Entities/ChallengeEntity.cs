namespace FeedEngine.Infrastructure.Persistence.Entities;

public class ChallengeEntity
{
    public required Guid Id { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required DateTime UpdatedAt { get; set; }

    public required string Title { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
