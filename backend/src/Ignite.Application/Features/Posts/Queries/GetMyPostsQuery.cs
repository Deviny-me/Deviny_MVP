using Ignite.Application.Common;
using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Queries;

/// <summary>
/// Query to get all posts for the current user.
/// </summary>
public class GetMyPostsQuery : IRequest<Result<UserPostsResponse>>
{
    /// <summary>
    /// The user whose posts to retrieve.
    /// </summary>
    public required Guid UserId { get; set; }
    
    /// <summary>
    /// Page number (1-based). Default: 1
    /// </summary>
    public int Page { get; set; } = 1;
    
    /// <summary>
    /// Number of posts per page. Default: 20
    /// </summary>
    public int PageSize { get; set; } = 20;
}
