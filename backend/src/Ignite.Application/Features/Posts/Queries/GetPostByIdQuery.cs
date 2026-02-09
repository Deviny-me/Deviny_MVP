using Ignite.Application.Common;
using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Queries;

/// <summary>
/// Query to get a single post by ID.
/// </summary>
public class GetPostByIdQuery : IRequest<Result<PostDto>>
{
    /// <summary>
    /// The ID of the post.
    /// </summary>
    public required Guid PostId { get; set; }
    
    /// <summary>
    /// The current user (for IsLikedByMe calculation). Null for anonymous.
    /// </summary>
    public Guid? CurrentUserId { get; set; }
}
