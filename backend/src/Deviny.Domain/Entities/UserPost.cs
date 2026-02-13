using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

/// <summary>
/// Represents a user's post (photo, video, achievement share, or repost).
/// This is the main entity for the fitness journal feature.
/// 
/// Design decisions:
/// - UserId FK to Users table (not role-specific, works for all users with levels)
/// - One-to-many with PostMedia (currently 1 media per post, but flexible for future carousels)
/// - Reposts reference OriginalPostId with optional quote text
/// - Soft delete preserves history while hiding from feeds
/// </summary>
public class UserPost : BaseEntity
{
    /// <summary>
    /// The user who created this post.
    /// </summary>
    public required Guid UserId { get; set; }
    
    /// <summary>
    /// Navigation property to the User entity.
    /// </summary>
    public User User { get; set; } = null!;
    
    /// <summary>
    /// Type of the post (Photo, Video, Achievement, Repost).
    /// </summary>
    public required PostType Type { get; set; }
    
    /// <summary>
    /// Optional caption/description for the post.
    /// Max length: 500 characters.
    /// </summary>
    public string? Caption { get; set; }
    
    /// <summary>
    /// Visibility of the post. Default: Public.
    /// </summary>
    public PostVisibility Visibility { get; set; } = PostVisibility.Public;
    
    /// <summary>
    /// For reposts: the original post being shared.
    /// Null for original posts.
    /// </summary>
    public Guid? OriginalPostId { get; set; }
    public UserPost? OriginalPost { get; set; }
    
    /// <summary>
    /// Optional quote/comment added when reposting.
    /// Max length: 280 characters.
    /// </summary>
    public string? RepostQuote { get; set; }
    
    /// <summary>
    /// Soft delete flag. Deleted posts are hidden from feeds.
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    
    /// <summary>
    /// Media files attached to this post.
    /// For MVP: typically 1 media per post.
    /// Future: can support multiple media (carousel).
    /// </summary>
    public ICollection<PostMedia> Media { get; set; } = new List<PostMedia>();
    
    /// <summary>
    /// Reposts of this post by other users.
    /// </summary>
    public ICollection<UserPost> Reposts { get; set; } = new List<UserPost>();
    
    /// <summary>
    /// Likes on this post.
    /// </summary>
    public ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
    
    /// <summary>
    /// Comments on this post.
    /// </summary>
    public ICollection<PostComment> Comments { get; set; } = new List<PostComment>();
}
