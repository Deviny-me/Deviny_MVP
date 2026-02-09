using Ignite.Application.Common;
using MediatR;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Command to add a like to a post.
/// </summary>
public class AddPostLikeCommand : IRequest<Result<bool>>
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
