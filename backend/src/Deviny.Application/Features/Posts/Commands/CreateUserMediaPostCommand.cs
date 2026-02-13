using Deviny.Application.Common;
using Deviny.Application.Features.Posts.DTOs;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Deviny.Application.Features.Posts.Commands;

/// <summary>
/// Command to create a new user media post (photo or video).
/// Uses IFormFile for file upload handling.
/// </summary>
public class CreateUserMediaPostCommand : IRequest<Result<PostDto>>
{
    /// <summary>
    /// The user creating the post.
    /// </summary>
    public required Guid UserId { get; set; }
    
    /// <summary>
    /// Type of the post (Photo or Video).
    /// </summary>
    public required PostType Type { get; set; }
    
    /// <summary>
    /// The media file to upload.
    /// </summary>
    public required IFormFile File { get; set; }
    
    /// <summary>
    /// Optional caption for the post.
    /// </summary>
    public string? Caption { get; set; }
    
    /// <summary>
    /// Visibility setting. Default: Public.
    /// </summary>
    public PostVisibility Visibility { get; set; } = PostVisibility.Public;
}
