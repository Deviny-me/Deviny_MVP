using Deviny.Application.Common;
using Deviny.Application.Features.Posts.DTOs;
using MediatR;

namespace Deviny.Application.Features.Posts.Commands;

/// <summary>
/// Command to add a like to a post.
/// Returns updated PostStatsDto for frontend reconciliation.
/// </summary>
public class AddPostLikeCommand : IRequest<Result<PostStatsDto>>
{
    /// <summary>
    /// The ID of the post to like.
    /// </summary>
    public required Guid PostId { get; set; }
    
    /// <summary>
    /// The user adding the like.
    /// </summary>
    public required Guid UserId { get; set; }
}
