namespace Ignite.Domain.Entities;

public class UserFollow
{
    public int Id { get; set; }
    public Guid FollowerId { get; set; }
    public User Follower { get; set; } = null!;
    public Guid TrainerId { get; set; }
    public User Trainer { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
