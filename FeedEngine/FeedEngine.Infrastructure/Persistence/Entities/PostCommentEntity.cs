namespace FeedEngine.Infrastructure.Persistence.Entities;

public class PostCommentEntity
{
    public required Guid Id { get; set; }
    public required Guid PostId { get; set; }
    public required Guid UserId { get; set; }
    public required string Text { get; set; }
}
