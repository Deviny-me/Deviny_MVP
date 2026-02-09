using Ignite.Application.Common;
using Ignite.Application.Features.Posts.DTOs;
using MediatR;

namespace Ignite.Application.Features.Posts.Commands;

/// <summary>
/// Command to create a comment on a post.
/// </summary>
public class CreatePostCommentCommand : IRequest<Result<PostCommentDto>>
{
    /// <summary>
    /// The ID of the post to comment on.
    /// </summary>
    public required Guid PostId { get; set; }
    
    /// <summary>
    /// The user creating the comment.
    /// </summary>
    public required Guid UserId { get; set; }
    
    /// <summary>
    /// The comment text content.
    /// </summary>
    public required string Content { get; set; }
    
    /// <summary>
    /// Optional parent comment ID for replies.
    /// </summary>
    public Guid? ParentCommentId { get; set; }
}
