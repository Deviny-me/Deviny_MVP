using Ignite.Application.Common;
using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Command to repost (share) another user's post.
/// </summary>
public class CreateRepostCommand : IRequest<Result<PostDto>>
{
    /// <summary>
    /// The ID of the original post to repost.
    /// </summary>
    public required Guid OriginalPostId { get; set; }
    
    /// <summary>
    /// The user creating the repost.
    /// </summary>
    public required Guid UserId { get; set; }
    
    /// <summary>
    /// Optional quote/comment to add to the repost.
    /// </summary>
    public string? Quote { get; set; }
}
