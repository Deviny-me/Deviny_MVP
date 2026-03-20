using Deviny.Application.Features.Purchases.Commands;
using Deviny.Application.Features.Purchases.DTOs;
using Deviny.Application.Features.Purchases.Queries;
using Deviny.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;

namespace Deviny.API.Controllers;

[Authorize]
[Route("api/me/purchases")]
public class MePurchasesController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly ILogger<MePurchasesController> _logger;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public MePurchasesController(
        IMediator mediator,
        ILogger<MePurchasesController> logger,
        IRealtimeNotifier realtimeNotifier)
    {
        _mediator = mediator;
        _logger = logger;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Purchase a program (training or meal)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> PurchaseProgram([FromBody] PurchaseProgramRequest request)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var command = new PurchaseProgramCommand
            {
                UserId = userId.Value,
                ProgramId = request.ProgramId,
                ProgramType = request.ProgramType,
                Tier = request.Tier
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { error = result.Error });

            await _realtimeNotifier.SendGlobalEntityChangedAsync(
                "purchases",
                "created",
                "purchase",
                result.PurchaseId,
                new { programId = request.ProgramId, programType = request.ProgramType, tier = request.Tier });

            return Ok(new { purchaseId = result.PurchaseId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error purchasing program {ProgramId} for user {UserId}",
                request.ProgramId, userId.Value);
            return StatusCode(500, CreateProblemDetails(
                "Purchase Failed",
                "An error occurred while processing the purchase.",
                500));
        }
    }

    /// <summary>
    /// Get current user's purchased programs
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PurchasedProgramDto>>> GetMyPurchases()
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var query = new GetMyPurchasesQuery(userId.Value);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting purchases for user {UserId}", userId.Value);
            return StatusCode(500, CreateProblemDetails(
                "Fetch Failed",
                "An error occurred while fetching purchases.",
                500));
        }
    }

    /// <summary>
    /// Mark a purchased program as completed (e.g. after finishing last video in journey)
    /// </summary>
    [HttpPost("{purchaseId:guid}/complete")]
    public async Task<IActionResult> CompletePurchase(Guid purchaseId)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var command = new CompletePurchaseCommand
            {
                UserId = userId.Value,
                PurchaseId = purchaseId
            };

            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(new { error = result.Error });

            await _realtimeNotifier.SendGlobalEntityChangedAsync(
                "purchases",
                "updated",
                "purchase",
                purchaseId,
                new { status = "completed" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing purchase {PurchaseId} for user {UserId}", purchaseId, userId.Value);
            return StatusCode(500, CreateProblemDetails(
                "Complete Purchase Failed",
                "An error occurred while marking purchase as completed.",
                500));
        }
    }
}


