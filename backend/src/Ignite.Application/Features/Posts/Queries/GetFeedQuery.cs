using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Queries;

/// <summary>
/// Query to get the feed of posts.
/// </summary>
public class GetFeedQuery : IRequest<UserPostsResponse>
{
    /// <summary>
    /// The current user (for IsLikedByMe calculation). Null for anonymous.
    /// </summary>
    public Guid? CurrentUserId { get; set; }
    
    /// <summary>
    /// Page number (1-based).
    /// </summary>
    public int Page { get; set; } = 1;
    
    /// <summary>
    /// Number of posts per page.
    /// </summary>
    public int PageSize { get; set; } = 20;
}
