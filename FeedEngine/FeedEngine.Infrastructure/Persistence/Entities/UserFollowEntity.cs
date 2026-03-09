namespace FeedEngine.Infrastructure.Persistence.Entities;

public class UserFollowEntity
{
    public required Guid Id { get; set; }
    public required Guid FollowerId { get; set; }
    public required Guid FolloweeId { get; set; }
}
