using Ignite.Application.Common;
using MediatR;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Command to delete a comment.
/// </summary>
public class DeletePostCommentCommand : IRequest<Result<bool>>
{
    /// <summary>
    /// The ID of the comment to delete.
    /// </summary>
    public required Guid CommentId { get; set; }
    
    /// <summary>
    /// The user deleting the comment (must be the owner).
    /// </summary>
    public required Guid UserId { get; set; }
}
