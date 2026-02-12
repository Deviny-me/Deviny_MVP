using Ignite.Domain.Entities;

namespace Ignite.Application.Common.Interfaces;

/// <summary>
/// Repository for PostLike entity operations.
/// </summary>
public interface IPostLikeRepository
{
    /// <summary>
    /// Adds a like to a post.
    /// </summary>
    Task<PostLike> AddAsync(PostLike like, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Removes a like from a post.
    /// </summary>
    Task<bool> RemoveAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Checks if a user has liked a post.
    /// </summary>
    Task<bool> ExistsAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets the number of likes on a post.
    /// </summary>
    Task<int> GetCountAsync(Guid postId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets paginated list of users who liked a post.
    /// </summary>
    Task<List<PostLike>> GetLikersPagedAsync(
        Guid postId, 
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Checks which posts from a list are liked by a user.
    /// Returns a set of post IDs that are liked.
    /// </summary>
    Task<HashSet<Guid>> GetLikedPostIdsAsync(
        IEnumerable<Guid> postIds, 
        Guid userId, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets like counts for multiple posts at once.
    /// Returns a dictionary of postId -> count.
    /// </summary>
    Task<Dictionary<Guid, int>> GetLikeCountsForPostsAsync(
        IEnumerable<Guid> postIds, 
        CancellationToken cancellationToken = default);
}
