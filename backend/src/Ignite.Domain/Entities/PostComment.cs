namespace Ignite.Domain.Entities;

/// <summary>
/// Represents a comment on a post.
/// Supports threaded replies via ParentCommentId.
/// Uses soft delete to preserve history.
/// </summary>
public class PostComment : BaseEntity
{
    /// <summary>
    /// The post this comment belongs to.
    /// </summary>
    public required Guid PostId { get; set; }
    public UserPost Post { get; set; } = null!;
    
    /// <summary>
    /// The user who wrote the comment.
    /// </summary>
    public required Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    /// <summary>
    /// Parent comment ID for threaded replies.
    /// Null for top-level comments.
    /// </summary>
    public Guid? ParentCommentId { get; set; }
    public PostComment? ParentComment { get; set; }
    
    /// <summary>
    /// Replies to this comment.
    /// </summary>
    public ICollection<PostComment> Replies { get; set; } = new List<PostComment>();
    
    /// <summary>
    /// The comment text content.
    /// Max length: 1000 characters.
    /// </summary>
    public required string Content { get; set; }
    
    /// <summary>
    /// Soft delete flag. Deleted comments show as "[удалено]" in UI.
    /// </summary>
    public bool IsDeleted { get; set; } = false;
}
