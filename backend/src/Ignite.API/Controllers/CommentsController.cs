using Ignite.Application.Features.Posts.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ignite.API.Controllers;

/// <summary>
/// Controller for comment-specific operations.
/// </summary>
[Route("api/comments")]
public class CommentsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(IMediator mediator, ILogger<CommentsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Delete a comment (soft delete).
    /// Only the comment author can delete.
    /// </summary>
    [Authorize]
    [HttpDelete("{commentId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComment(Guid commentId)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var command = new DeletePostCommentCommand
        {
            CommentId = commentId,
            UserId = userId.Value
        };

        var result = await _mediator.Send(command);

        if (result.IsFailure)
        {
            if (result.Error.Code == "Comment.NotFound")
            {
                return NotFound(new ProblemDetails
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                    Title = result.Error.Code,
                    Detail = result.Error.Message,
                    Status = StatusCodes.Status404NotFound
                });
            }

            if (result.Error.Code == "Comment.NotOwner")
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.3",
                    Title = result.Error.Code,
                    Detail = result.Error.Message,
                    Status = StatusCodes.Status403Forbidden
                });
            }

            return BadRequest(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Title = result.Error.Code,
                Detail = result.Error.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }

        _logger.LogInformation("User {UserId} deleted comment {CommentId}", userId, commentId);
        return NoContent();
    }
}
