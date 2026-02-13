using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

/// <summary>
/// Repository for PostComment entity operations.
/// </summary>
public interface IPostCommentRepository
{
    /// <summary>
    /// Gets a comment by its ID.
    /// </summary>
    Task<PostComment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Creates a new comment.
    /// </summary>
    Task<PostComment> CreateAsync(PostComment comment, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Soft deletes a comment (sets IsDeleted = true).
    /// </summary>
    Task<bool> SoftDeleteAsync(Guid commentId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets paginated comments for a post (excluding deleted).
    /// Ordered by creation date ascending (oldest first).
    /// </summary>
    Task<List<PostComment>> GetByPostIdPagedAsync(
        Guid postId, 
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets the total count of comments on a post (excluding deleted).
    /// </summary>
    Task<int> GetCountByPostIdAsync(Guid postId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets comment counts for multiple posts at once.
    /// Returns a dictionary of postId -> count.
    /// </summary>
    Task<Dictionary<Guid, int>> GetCountsForPostsAsync(
        IEnumerable<Guid> postIds, 
        CancellationToken cancellationToken = default);
}
