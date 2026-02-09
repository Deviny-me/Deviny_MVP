using Ignite.Application.Common;
using MediatR;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Command to remove a like from a post.
/// </summary>
public class RemovePostLikeCommand : IRequest<Result<bool>>
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
