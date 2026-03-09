namespace FeedEngine.Domain.Models;

public class AchievementFeedItem : FeedItem
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int Points { get; set; }
}
