using Deviny.Application.Features.Reviews.Commands;
using Deviny.Application.Features.Reviews.DTOs;
using Deviny.Application.Features.Reviews.Queries;
using Deviny.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/reviews")]
public class ReviewsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly ILogger<ReviewsController> _logger;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public ReviewsController(
        IMediator mediator,
        ILogger<ReviewsController> logger,
        IRealtimeNotifier realtimeNotifier)
    {
        _mediator = mediator;
        _logger = logger;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Get reviews for a program (public)
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<ReviewDto>>> GetProgramReviews(
        [FromQuery] Guid programId,
        [FromQuery] string programType)
    {
        try
        {
            var query = new GetProgramReviewsQuery(programId, programType);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reviews for program {ProgramId}", programId);
            return StatusCode(500, CreateProblemDetails(
                "Fetch Failed",
                "An error occurred while fetching reviews.",
                500));
        }
    }

    /// <summary>
    /// Get all reviews for an expert's programs (public)
    /// </summary>
    [AllowAnonymous]
    [HttpGet("expert/{expertId:guid}")]
    public async Task<ActionResult<List<ReviewDto>>> GetExpertReviews(Guid expertId)
    {
        try
        {
            var query = new GetExpertReviewsQuery(expertId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reviews for expert {ExpertId}", expertId);
            return StatusCode(500, CreateProblemDetails(
                "Fetch Failed",
                "An error occurred while fetching reviews.",
                500));
        }
    }

    /// <summary>
    /// Create a review for a completed program
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var command = new CreateReviewCommand
            {
                UserId = userId.Value,
                ProgramId = request.ProgramId,
                ProgramType = request.ProgramType,
                Rating = request.Rating,
                Comment = request.Comment
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { error = result.Error });

            // Realtime refresh for all connected clients where program/review cards are shown.
            // Best-effort: review must stay saved even if SignalR push fails.
            try
            {
                await _realtimeNotifier.SendGlobalEntityChangedAsync(
                    scope: "programs",
                    action: "review-created",
                    entityType: "programReview",
                    entityId: result.ReviewId,
                    payload: new
                    {
                        programId = request.ProgramId,
                        programType = request.ProgramType,
                        rating = request.Rating
                    });

                await _realtimeNotifier.SendGlobalEntityChangedAsync(
                    scope: "reviews",
                    action: "review-created",
                    entityType: "programReview",
                    entityId: result.ReviewId,
                    payload: new
                    {
                        programId = request.ProgramId,
                        programType = request.ProgramType
                    });
            }
            catch (Exception pushEx)
            {
                _logger.LogWarning(pushEx,
                    "Review {ReviewId} was created, but realtime push failed.",
                    result.ReviewId);
            }

            return Ok(new { reviewId = result.ReviewId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating review for program {ProgramId} by user {UserId}",
                request.ProgramId, userId.Value);
            return StatusCode(500, CreateProblemDetails(
                "Review Failed",
                "An error occurred while submitting the review.",
                500));
        }
    }
}

/// <summary>
/// Request body for creating a review
/// </summary>
public class CreateReviewRequest
{
    public Guid ProgramId { get; set; }
    public string ProgramType { get; set; } = string.Empty; // "training" or "meal"
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
