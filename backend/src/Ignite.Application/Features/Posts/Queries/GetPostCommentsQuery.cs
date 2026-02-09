using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Queries;

/// <summary>
/// Query to get comments for a post.
/// </summary>
public class GetPostCommentsQuery : IRequest<PostCommentsResponse>
{
    /// <summary>
    /// The ID of the post.
    /// </summary>
    public required Guid PostId { get; set; }
    
    /// <summary>
    /// Page number (1-based).
    /// </summary>
    public int Page { get; set; } = 1;
    
    /// <summary>
    /// Number of comments per page.
    /// </summary>
    public int PageSize { get; set; } = 20;
}
