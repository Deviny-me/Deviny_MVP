using Deviny.Domain.Enums;

namespace Deviny.Application.Features.Posts.DTOs;

/// <summary>
/// DTO representing basic author information for posts and comments.
/// </summary>
public class PostAuthorDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Slug { get; set; }
    public UserRole Role { get; set; }
    
    public string FullName => $"{FirstName} {LastName}".Trim();
}

/// <summary>
/// DTO representing media attached to a post.
/// </summary>
public class PostMediaDto
{
    public Guid Id { get; set; }
    public MediaType MediaType { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int DisplayOrder { get; set; }
}

/// <summary>
/// DTO representing a user post for API responses.
/// Includes social interaction counts and state.
/// </summary>
public class PostDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public PostAuthorDto? Author { get; set; }
    public PostType Type { get; set; }
    public string? Caption { get; set; }
    public PostVisibility Visibility { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PostMediaDto> Media { get; set; } = new();
    
    // Social interaction counts
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public int RepostCount { get; set; }
    
    // Current user's interaction state
    public bool IsLikedByMe { get; set; }
    public bool IsRepostedByMe { get; set; }
    
    // Repost fields
    public bool IsRepost => OriginalPostId.HasValue;
    public Guid? OriginalPostId { get; set; }
    public string? RepostQuote { get; set; }
    public PostDto? OriginalPost { get; set; }
}

/// <summary>
/// DTO with updated stats and viewer flags, returned by mutation endpoints (like, repost).
/// Allows the frontend to reconcile optimistic updates with the server state.
/// </summary>
public class PostStatsDto
{
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public int RepostCount { get; set; }
    public bool IsLikedByMe { get; set; }
    public bool IsRepostedByMe { get; set; }
}

/// <summary>
/// Response for paginated posts list.
/// </summary>
public class UserPostsResponse
{
    public List<PostDto> Posts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasMore => Page * PageSize < TotalCount;
}

/// <summary>
/// DTO representing a comment on a post.
/// </summary>
public class PostCommentDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public PostAuthorDto Author { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid? ParentCommentId { get; set; }
    
    /// <summary>
    /// Whether the current user can delete this comment
    /// (true if user is comment author OR post author).
    /// </summary>
    public bool CanDelete { get; set; }
}

/// <summary>
/// Response for paginated comments list.
/// </summary>
public class PostCommentsResponse
{
    public List<PostCommentDto> Comments { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasMore => Page * PageSize < TotalCount;
}
