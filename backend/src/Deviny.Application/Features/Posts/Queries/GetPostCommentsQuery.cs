using Deviny.Application.Features.Posts.DTOs;
using MediatR;

namespace Deviny.Application.Features.Posts.Queries;

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
    
    /// <summary>
    /// Current authenticated user ID (nullable for anonymous).
    /// Used to compute CanDelete on each comment.
    /// </summary>
    public Guid? CurrentUserId { get; set; }
}
