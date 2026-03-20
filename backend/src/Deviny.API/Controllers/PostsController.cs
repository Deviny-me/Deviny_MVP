using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Posts.Commands;
using Deviny.Application.Features.Posts.DTOs;
using Deviny.Application.Features.Posts.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;

namespace Deviny.API.Controllers;

/// <summary>
/// Controller for public post operations including likes, comments, and reposts.
/// </summary>
[Route("api/posts")]
public class PostsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly ILogger<PostsController> _logger;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public PostsController(
        IMediator mediator,
        ILogger<PostsController> logger,
        IRealtimeNotifier realtimeNotifier)
    {
        _mediator = mediator;
        _logger = logger;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Get a single post by ID.
    /// </summary>
    [HttpGet("{postId:guid}")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostDto>> GetPost(Guid postId)
    {
        var userId = TryGetCurrentUserId();
        
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
    /// Get posts for a specific user by their ID.
    /// Returns only public posts for other users; all posts for the authenticated user.
    /// </summary>
    /// <param name="userId">Target user ID</param>
    /// <param name="tab">Filter: all, videos, reposts (default: all)</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 20, max: 100)</param>
    [HttpGet("/api/users/{userId:guid}/posts")]
    [ProducesResponseType(typeof(UserPostsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserPostsResponse>> GetUserPosts(
        Guid userId,
        [FromQuery] string tab = "all",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = TryGetCurrentUserId();

        if (!TryParseTab(tab, out var profileTab))
        {
            return BadRequest(CreateProblemDetails(
                "InvalidTab",
                "Tab must be 'all', 'videos', or 'reposts'.",
                StatusCodes.Status400BadRequest));
        }

        var query = new GetUserPostsQuery
        {
            TargetUserId = userId,
            CurrentUserId = currentUserId,
            Tab = profileTab,
            Page = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query);

        if (result.IsFailure)
        {
            return BadRequest(CreateProblemDetails(
                result.Error.Code,
                result.Error.Message,
                StatusCodes.Status400BadRequest));
        }

        return Ok(result.Value);
    }

    private static bool TryParseTab(string tab, out ProfilePostTab result)
    {
        result = tab.ToLowerInvariant() switch
        {
            "all" => ProfilePostTab.All,
            "videos" => ProfilePostTab.Videos,
            "reposts" => ProfilePostTab.Reposts,
            _ => (ProfilePostTab)(-1)
        };
        return Enum.IsDefined(result);
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
        var userId = TryGetCurrentUserId();
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
        await _realtimeNotifier.SendGlobalEntityChangedAsync(
            "posts",
            "updated",
            "post",
            postId,
            new { reason = "like", actorUserId = userId.Value, stats = result.Value });
        return Ok(result.Value);
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
        var userId = TryGetCurrentUserId();
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
        await _realtimeNotifier.SendGlobalEntityChangedAsync(
            "posts",
            "updated",
            "post",
            postId,
            new { reason = "unlike", actorUserId = userId.Value, stats = result.Value });
        return Ok(result.Value);
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
            PageSize = pageSize,
            CurrentUserId = TryGetCurrentUserId()
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
        var userId = TryGetCurrentUserId();
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
        await _realtimeNotifier.SendGlobalEntityChangedAsync(
            "posts",
            "updated",
            "post",
            postId,
            new
            {
                reason = "comment-added",
                actorUserId = userId.Value,
                commentId = result.Value.Id,
                parentCommentId = result.Value.ParentCommentId
            });
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
        var userId = TryGetCurrentUserId();
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
        await _realtimeNotifier.SendGlobalEntityChangedAsync(
            "posts",
            "updated",
            "post",
            postId,
            new
            {
                reason = "repost-created",
                actorUserId = userId.Value,
                repostId = result.Value.Id
            });
        return CreatedAtAction(nameof(GetPost), new { postId = result.Value.Id }, result.Value);
    }

    /// <summary>
    /// Remove a repost of a post.
    /// </summary>
    [Authorize]
    [HttpDelete("{postId:guid}/repost")]
    [ProducesResponseType(typeof(PostStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRepost(Guid postId)
    {
        var userId = TryGetCurrentUserId();
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
        await _realtimeNotifier.SendGlobalEntityChangedAsync(
            "posts",
            "updated",
            "post",
            postId,
            new { reason = "repost-removed", actorUserId = userId.Value, stats = result.Value });
        return Ok(result.Value);
    }
}


