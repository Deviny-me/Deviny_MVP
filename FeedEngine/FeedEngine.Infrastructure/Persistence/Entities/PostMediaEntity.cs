namespace FeedEngine.Infrastructure.Persistence.Entities;

public class PostMediaEntity
{
    public required Guid Id { get; set; }
    public required Guid PostId { get; set; }
    public required string Url { get; set; }
    public int Order { get; set; }
}
