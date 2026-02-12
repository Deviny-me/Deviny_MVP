using Ignite.Application.Common;
using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Command to remove a like from a post.
/// Returns updated PostStatsDto for frontend reconciliation.
/// </summary>
public class RemovePostLikeCommand : IRequest<Result<PostStatsDto>>
{
    /// <summary>
    /// The ID of the post to unlike.
    /// </summary>
    public required Guid PostId { get; set; }
    
    /// <summary>
    /// The user removing the like.
    /// </summary>
    public required Guid UserId { get; set; }
}
