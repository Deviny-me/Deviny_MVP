namespace FeedEngine.Domain.Models;

public class ChallengeFeedItem : FeedItem
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateTime? EndsAt { get; set; }
}
