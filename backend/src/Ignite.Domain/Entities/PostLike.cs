namespace Ignite.Domain.Entities;

/// <summary>
/// Represents a like on a post.
/// Uses int Id like other social relationship entities (UserFollow, UserBlock).
/// Composite unique constraint on (PostId, UserId) prevents duplicate likes.
/// </summary>
public class PostLike
{
    public int Id { get; set; }
    
    /// <summary>
    /// The post that was liked.
    /// </summary>
    public Guid PostId { get; set; }
    public UserPost Post { get; set; } = null!;
    
    /// <summary>
    /// The user who liked the post.
    /// </summary>
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    /// <summary>
    /// When the like was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
