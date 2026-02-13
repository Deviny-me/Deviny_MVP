using Deviny.Application.Common;
using MediatR;

namespace Deviny.Application.Features.Posts.Commands;

/// <summary>
/// Command to delete a user's post.
/// </summary>
public class DeleteUserPostCommand : IRequest<Result<bool>>
{
    /// <summary>
    /// The user deleting the post (must be the owner).
    /// </summary>
    public required Guid UserId { get; set; }
    
    /// <summary>
    /// The ID of the post to delete.
    /// </summary>
    public required Guid PostId { get; set; }
}
