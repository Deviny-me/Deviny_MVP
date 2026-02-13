using Deviny.Application.Common;
using Deviny.Application.Features.Posts.DTOs;
using MediatR;

namespace Deviny.Application.Features.Posts.Commands;

/// <summary>
/// Command to delete (remove) a repost.
/// Returns updated PostStatsDto for the original post.
/// </summary>
public class DeleteRepostCommand : IRequest<Result<PostStatsDto>>
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
