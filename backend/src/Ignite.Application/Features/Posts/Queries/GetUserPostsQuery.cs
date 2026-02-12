using Ignite.Application.Common;
using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Queries;

/// <summary>
/// Query to get posts for any user by their ID.
/// Used for viewing another user's profile posts.
/// </summary>
public class GetUserPostsQuery : IRequest<Result<UserPostsResponse>>
{
    /// <summary>
    /// The user whose posts to retrieve.
    /// </summary>
    public required Guid TargetUserId { get; set; }
    
    /// <summary>
    /// The current authenticated user (null if anonymous).
    /// Used for viewer flags (hasLiked, hasReposted).
    /// </summary>
    public Guid? CurrentUserId { get; set; }
    
    /// <summary>
    /// Profile tab filter: All, Videos, Reposts. Default: All
    /// </summary>
    public ProfilePostTab Tab { get; set; } = ProfilePostTab.All;
    
    /// <summary>
    /// Page number (1-based). Default: 1
    /// </summary>
    public int Page { get; set; } = 1;
    
    /// <summary>
    /// Items per page. Default: 20
    /// </summary>
    public int PageSize { get; set; } = 20;
}
