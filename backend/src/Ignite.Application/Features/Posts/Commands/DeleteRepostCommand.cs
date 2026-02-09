using Ignite.Application.Common;
using MediatR;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Command to delete (remove) a repost.
/// </summary>
public class DeleteRepostCommand : IRequest<Result>
{
    /// <summary>
    /// The ID of the original post that was reposted.
    /// </summary>
    public required Guid OriginalPostId { get; set; }
    
    /// <summary>
    /// The user who created the repost.
    /// </summary>
    public required Guid UserId { get; set; }
}
