using Ignite.Application.Common;
using Ignite.Application.Features.Posts.Commands;
using Ignite.Application.Features.Posts.DTOs;
using Ignite.Application.Features.Posts.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ignite.API.Controllers;

/// <summary>
/// Controller for public post operations including likes, comments, and reposts.
/// </summary>
[Route("api/posts")]
public class PostsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly ILogger<PostsController> _logger;

    public PostsController(IMediator mediator, ILogger<PostsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get a single post by ID.
    /// </summary>
    [HttpGet("{postId:guid}")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostDto>> GetPost(Guid postId)
    {
        var userId = GetUserId();
        
        var query = new GetPostByIdQuery
        {
            PostId = postId,
            CurrentUserId = userId
        };

        var result = await _mediator.Send(query);

        if (result.IsFailure)
        {
            return NotFound(CreateProblemDetails(
                result.Error.Code,
                result.Error.Message,
                StatusCodes.Status404NotFound));
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Add a like to a post.
    /// </summary>
    [Authorize]
    [HttpPost("{postId:guid}/likes")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddLike(Guid postId)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var command = new AddPostLikeCommand
        {
            PostId = postId,
            UserId = userId.Value
        };

        var result = await _mediator.Send(command);

        if (result.IsFailure)
        {
            if (result.Error.Code == "Post.NotFound")
            {
                return NotFound(CreateProblemDetails(
                    result.Error.Code,
                    result.Error.Message,
                    StatusCodes.Status404NotFound));
            }

            if (result.Error.Code == "Like.AlreadyExists")
            {
                return Conflict(CreateProblemDetails(
                    result.Error.Code,
                    result.Error.Message,
                    StatusCodes.Status409Conflict));
            }

            return BadRequest(CreateProblemDetails(
                result.Error.Code,
                result.Error.Message,
                StatusCodes.Status400BadRequest));
        }

        _logger.LogInformation("User {UserId} liked post {PostId}", userId, postId);
        return Ok(new { success = true });
    }

    /// <summary>
    /// Remove a like from a post.
    /// </summary>
    [Authorize]
    [HttpDelete("{postId:guid}/likes")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveLike(Guid postId)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var command = new RemovePostLikeCommand
        {
            PostId = postId,
            UserId = userId.Value
        };

        var result = await _mediator.Send(command);

        if (result.IsFailure)
        {
            if (result.Error.Code == "Like.NotFound")
            {
                return NotFound(CreateProblemDetails(
                    result.Error.Code,
                    result.Error.Message,
                    StatusCodes.Status404NotFound));
            }

            return BadRequest(CreateProblemDetails(
                result.Error.Code,
                result.Error.Message,
                StatusCodes.Status400BadRequest));
        }

        _logger.LogInformation("User {UserId} unliked post {PostId}", userId, postId);
        return Ok(new { success = true });
    }

    /// <summary>
    /// Get comments for a post.
    /// </summary>
    [HttpGet("{postId:guid}/comments")]
    [ProducesResponseType(typeof(PostCommentsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PostCommentsResponse>> GetComments(
        Guid postId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Min(pageSize, 100);
        
        var query = new GetPostCommentsQuery
        {
            PostId = postId,
            Page = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Add a comment to a post.
    /// </summary>
    [Authorize]
    [HttpPost("{postId:guid}/comments")]
    [ProducesResponseType(typeof(PostCommentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostCommentDto>> AddComment(
        Guid postId,
        [FromBody] CreateCommentRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var command = new CreatePostCommentCommand
        {
            PostId = postId,
            UserId = userId.Value,
            Content = request.Content,
            ParentCommentId = request.ParentCommentId
        };

        var result = await _mediator.Send(command);

        if (result.IsFailure)
        {
            if (result.Error.Code == "Post.NotFound" || result.Error.Code == "Comment.ParentNotFound")
            {
                return NotFound(CreateProblemDetails(
                    result.Error.Code,
                    result.Error.Message,
                    StatusCodes.Status404NotFound));
            }

            return BadRequest(CreateProblemDetails(
                result.Error.Code,
                result.Error.Message,
                StatusCodes.Status400BadRequest));
        }

        _logger.LogInformation("User {UserId} commented on post {PostId}", userId, postId);
        return CreatedAtAction(nameof(GetComments), new { postId }, result.Value);
    }

    /// <summary>
    /// Repost (share) another user's post.
    /// </summary>
    [Authorize]
    [HttpPost("{postId:guid}/repost")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PostDto>> CreateRepost(
        Guid postId,
        [FromBody] CreateRepostRequest? request = null)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var command = new CreateRepostCommand
        {
            OriginalPostId = postId,
            UserId = userId.Value,
            Quote = request?.Quote
        };

        var result = await _mediator.Send(command);

        if (result.IsFailure)
        {
            if (result.Error.Code == "Post.NotFound")
            {
                return NotFound(CreateProblemDetails(
                    result.Error.Code,
                    result.Error.Message,
                    StatusCodes.Status404NotFound));
            }

            if (result.Error.Code == "Repost.AlreadyExists")
            {
                return Conflict(CreateProblemDetails(
                    result.Error.Code,
                    result.Error.Message,
                    StatusCodes.Status409Conflict));
            }

            return BadRequest(CreateProblemDetails(
                result.Error.Code,
                result.Error.Message,
                StatusCodes.Status400BadRequest));
        }

        _logger.LogInformation("User {UserId} reposted post {PostId}", userId, postId);
        return CreatedAtAction(nameof(GetPost), new { postId = result.Value.Id }, result.Value);
    }

    /// <summary>
    /// Remove a repost of a post.
    /// </summary>
    [Authorize]
    [HttpDelete("{postId:guid}/repost")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRepost(Guid postId)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var command = new DeleteRepostCommand
        {
            OriginalPostId = postId,
            UserId = userId.Value
        };

        var result = await _mediator.Send(command);

        if (result.IsFailure)
        {
            return NotFound(CreateProblemDetails(
                result.Error.Code,
                result.Error.Message,
                StatusCodes.Status404NotFound));
        }

        _logger.LogInformation("User {UserId} removed repost of post {PostId}", userId, postId);
        return NoContent();
    }

    private static ProblemDetails CreateProblemDetails(string code, string detail, int status)
    {
        return new ProblemDetails
        {
            Type = status switch
            {
                400 => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                404 => "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                409 => "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                _ => "https://tools.ietf.org/html/rfc7231#section-6.6.1"
            },
            Title = code,
            Detail = detail,
            Status = status
        };
    }
    
    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
            ?? User.FindFirst("sub")
            ?? User.FindFirst("userId");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return null;
        }

        return userId;
    }
}

/// <summary>
/// Request body for creating a comment.
/// </summary>
public class CreateCommentRequest
{
    public required string Content { get; set; }
    public Guid? ParentCommentId { get; set; }
}

/// <summary>
/// Request body for creating a repost.
/// </summary>
public class CreateRepostRequest
{
    public string? Quote { get; set; }
}
