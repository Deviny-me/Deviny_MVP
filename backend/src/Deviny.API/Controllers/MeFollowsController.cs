using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs;
using Deviny.Application.Features.Friends.Commands;
using Deviny.Application.Features.Friends.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/me/follows")]
public class MeFollowsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public MeFollowsController(IMediator mediator, IRealtimeNotifier realtimeNotifier)
    {
        _mediator = mediator;
        _realtimeNotifier = realtimeNotifier;
    }

    [HttpPost("{trainerId}")]
    public async Task<IActionResult> FollowTrainer(Guid trainerId)
    {
        var userId = GetCurrentUserId();
        if (userId == trainerId)
        {
            return BadRequest(CreateProblemDetails(
                "SelfFollow",
                "Cannot follow yourself.",
                StatusCodes.Status400BadRequest));
        }

        var command = new FollowTrainerCommand
        {
            FollowerId = userId,
            TrainerId = trainerId
        };

        await _mediator.Send(command);

        await _realtimeNotifier.SendEntityChangedToUsersAsync(
            new[] { userId, trainerId },
            "follows",
            "created",
            "follow",
            trainerId,
            new { followerId = userId, trainerId });

        return NoContent();
    }

    [HttpDelete("{trainerId}")]
    public async Task<IActionResult> UnfollowTrainer(Guid trainerId)
    {
        var userId = GetCurrentUserId();
        var command = new UnfollowTrainerCommand
        {
            FollowerId = userId,
            TrainerId = trainerId
        };

        await _mediator.Send(command);

        await _realtimeNotifier.SendEntityChangedToUsersAsync(
            new[] { userId, trainerId },
            "follows",
            "deleted",
            "follow",
            trainerId,
            new { followerId = userId, trainerId });

        return NoContent();
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<FriendDto>>> GetMyFollowing(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 100) pageSize = 100;

        var userId = GetCurrentUserId();
        var query = new GetMyFollowingQuery { UserId = userId, Page = page, PageSize = pageSize };
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
