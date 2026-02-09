using FluentValidation;
using Ignite.Application.Common;
using Ignite.Application.Features.Posts.Commands;
using Ignite.Application.Features.Posts.DTOs;
using Ignite.Application.Features.Posts.Queries;
using Ignite.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ignite.API.Controllers;

/// <summary>
/// Controller for managing user posts (media uploads).
/// Available to all authenticated users regardless of role.
/// </summary>
[Authorize]
[Route("api/me/posts")]
public class MePostsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly ILogger<MePostsController> _logger;

    public MePostsController(IMediator mediator, ILogger<MePostsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Upload a new media post (photo or video).
    /// </summary>
    /// <param name="file">The media file to upload</param>
    /// <param name="type">Post type: Photo (0) or Video (1)</param>
    /// <param name="caption">Optional caption (max 500 chars)</param>
    /// <returns>Created post with media URLs</returns>
    [HttpPost("media")]
    [RequestSizeLimit(150 * 1024 * 1024)] // 150MB max for video uploads
    [RequestFormLimits(MultipartBodyLengthLimit = 150 * 1024 * 1024)]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PostDto>> CreateMediaPost(
        [FromForm] IFormFile file,
        [FromForm] PostType type,
        [FromForm] string? caption = null)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(CreateProblemDetails(
                "Unauthorized", 
                "User is not authenticated.",
                StatusCodes.Status401Unauthorized));
        }

        try
        {
            var command = new CreateUserMediaPostCommand
            {
                UserId = userId.Value,
                Type = type,
                File = file,
                Caption = caption
            };

            var result = await _mediator.Send(command);

            if (result.IsFailure)
            {
                return BadRequest(CreateProblemDetails(
                    result.Error.Code, 
                    result.Error.Message,
                    StatusCodes.Status400BadRequest));
            }

            _logger.LogInformation(
                "User {UserId} created {PostType} post {PostId}",
                userId, type, result.Value.Id);

            return CreatedAtAction(
                nameof(GetMyPosts), 
                new { }, 
                result.Value);
        }
        catch (ValidationException ex)
        {
            var errors = ex.Errors
                .Select(e => new { field = e.PropertyName, message = e.ErrorMessage })
                .ToList();
            
            return BadRequest(new 
            {
                type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                title = "Validation Error",
                status = 400,
                errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating media post for user {UserId}", userId);
            return StatusCode(
                StatusCodes.Status500InternalServerError, 
                CreateProblemDetails(
                    "InternalError",
                    "An unexpected error occurred while creating the post.",
                    StatusCodes.Status500InternalServerError));
        }
    }

    /// <summary>
    /// Get all posts for the current user.
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Posts per page (default: 20, max: 100)</param>
    /// <returns>Paginated list of posts with media</returns>
    [HttpGet]
    [ProducesResponseType(typeof(UserPostsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserPostsResponse>> GetMyPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var query = new GetMyPostsQuery
            {
                UserId = userId.Value,
                Page = page,
                PageSize = pageSize
            };

            var result = await _mediator.Send(query);

            if (result.IsFailure)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    CreateProblemDetails(
                        result.Error.Code,
                        result.Error.Message,
                        StatusCodes.Status500InternalServerError));
            }

            return Ok(result.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts for user {UserId}", userId);
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                CreateProblemDetails(
                    "InternalError",
                    "An unexpected error occurred while retrieving posts.",
                    StatusCodes.Status500InternalServerError));
        }
    }

    /// <summary>
    /// Delete a post.
    /// </summary>
    /// <param name="postId">The ID of the post to delete</param>
    /// <returns>Success if deleted</returns>
    [HttpDelete("{postId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeletePost([FromRoute] Guid postId)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var command = new DeleteUserPostCommand
            {
                UserId = userId.Value,
                PostId = postId
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
                
                if (result.Error.Code == "Post.NotOwner")
                {
                    return StatusCode(
                        StatusCodes.Status403Forbidden,
                        CreateProblemDetails(
                            result.Error.Code,
                            result.Error.Message,
                            StatusCodes.Status403Forbidden));
                }

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    CreateProblemDetails(
                        result.Error.Code,
                        result.Error.Message,
                        StatusCodes.Status500InternalServerError));
            }

            _logger.LogInformation("User {UserId} deleted post {PostId}", userId, postId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting post {PostId} for user {UserId}", postId, userId);
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                CreateProblemDetails(
                    "InternalError",
                    "An unexpected error occurred while deleting the post.",
                    StatusCodes.Status500InternalServerError));
        }
    }

    /// <summary>
    /// Get user ID from JWT claims.
    /// </summary>
    private Guid? GetUserId()
    {
        // Try different claim types for user ID
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
            ?? User.FindFirst("sub")
            ?? User.FindFirst("userId");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            // Fallback: try to get from email claim and lookup user
            return null;
        }

        return userId;
    }

    /// <summary>
    /// Creates a standardized ProblemDetails response according to RFC 7807.
    /// </summary>
    private static ProblemDetails CreateProblemDetails(string title, string detail, int status)
    {
        return new ProblemDetails
        {
            Type = status switch
            {
                400 => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                401 => "https://tools.ietf.org/html/rfc7235#section-3.1",
                404 => "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                500 => "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                _ => "https://tools.ietf.org/html/rfc7231#section-6.5.1"
            },
            Title = title,
            Detail = detail,
            Status = status
        };
    }
}
