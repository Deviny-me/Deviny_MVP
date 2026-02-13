using Deviny.Application.Features.Posts.DTOs;
using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

/// <summary>
/// Repository for UserPost entity operations.
/// Follows the repository pattern for data access abstraction.
/// </summary>
public interface IUserPostRepository
{
    /// <summary>
    /// Gets a post by its ID with related media.
    /// </summary>
    Task<UserPost?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets a post by ID only if it belongs to the specified user.
    /// </summary>
    Task<UserPost?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets a post by ID for deletion, including already soft-deleted posts.
    /// Used to allow users to delete reposts whose original post was deleted.
    /// </summary>
    Task<UserPost?> GetByIdForDeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets all posts for a user, ordered by creation date descending.
    /// Includes related media.
    /// </summary>
    Task<List<UserPost>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets paginated posts for a user.
    /// </summary>
    Task<List<UserPost>> GetByUserIdPagedAsync(
        Guid userId, 
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets paginated posts for a user filtered by profile tab.
    /// </summary>
    Task<List<UserPost>> GetByUserIdPagedAsync(
        Guid userId, 
        ProfilePostTab tab,
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets paginated PUBLIC posts for a user (for viewing other people's profiles).
    /// Only returns non-deleted posts with Public visibility.
    /// </summary>
    Task<List<UserPost>> GetPublicByUserIdPagedAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets paginated PUBLIC posts for a user filtered by profile tab.
    /// </summary>
    Task<List<UserPost>> GetPublicByUserIdPagedAsync(
        Guid userId,
        ProfilePostTab tab,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets total count of PUBLIC posts for a user.
    /// </summary>
    Task<int> GetPublicCountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets total count of PUBLIC posts for a user filtered by profile tab.
    /// </summary>
    Task<int> GetPublicCountByUserIdAsync(Guid userId, ProfilePostTab tab, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets the total count of posts for a user.
    /// </summary>
    Task<int> GetCountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets the total count of posts for a user filtered by profile tab.
    /// </summary>
    Task<int> GetCountByUserIdAsync(Guid userId, ProfilePostTab tab, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Creates a new post with its media.
    /// </summary>
    Task<UserPost> CreateAsync(UserPost post, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Updates an existing post.
    /// </summary>
    Task<UserPost> UpdateAsync(UserPost post, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Deletes a post and its related media records.
    /// Note: Physical file deletion should be handled by the caller via IFileStorageService.
    /// </summary>
    Task DeleteAsync(UserPost post, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Soft deletes a post (sets IsDeleted = true).
    /// </summary>
    Task SoftDeleteAsync(UserPost post, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Soft deletes all reposts of a given post.
    /// Called when the original post is deleted.
    /// </summary>
    Task SoftDeleteRepostsOfPostAsync(Guid originalPostId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets the public feed of posts (paginated).
    /// Returns non-deleted, public posts ordered by creation date descending.
    /// </summary>
    Task<List<UserPost>> GetFeedPagedAsync(
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets total count of public feed posts.
    /// </summary>
    Task<int> GetFeedCountAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets the number of reposts for a post.
    /// </summary>
    Task<int> GetRepostCountAsync(Guid postId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets repost counts for multiple posts at once.
    /// Returns a dictionary of postId -> count.
    /// </summary>
    Task<Dictionary<Guid, int>> GetRepostCountsForPostsAsync(
        IEnumerable<Guid> postIds, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Checks if a user has reposted a post.
    /// </summary>
    Task<bool> HasUserRepostedAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets a user's repost of a specific original post.
    /// Returns null if the user hasn't reposted this post.
    /// </summary>
    Task<UserPost?> GetUserRepostAsync(Guid originalPostId, Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets which posts from a list have been reposted by a user.
    /// Returns a set of original post IDs that have been reposted.
    /// </summary>
    Task<HashSet<Guid>> GetRepostedPostIdsByUserAsync(
        IEnumerable<Guid> postIds, 
        Guid userId, 
        CancellationToken cancellationToken = default);
}
