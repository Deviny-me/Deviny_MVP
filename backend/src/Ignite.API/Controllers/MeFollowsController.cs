using Ignite.Application.DTOs;
using Ignite.Application.Features.Friends.Commands;
using Ignite.Application.Features.Friends.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ignite.API.Controllers;

[Route("api/me/follows")]
public class MeFollowsController : BaseApiController
{
    private readonly IMediator _mediator;

    public MeFollowsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("{trainerId}")]
    public async Task<IActionResult> FollowTrainer(Guid trainerId)
    {
        var userId = GetCurrentUserId();
        var command = new FollowTrainerCommand
        {
            FollowerId = userId,
            TrainerId = trainerId
        };

        await _mediator.Send(command);
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
        return NoContent();
    }

    [HttpGet]
    public async Task<ActionResult<List<FriendDto>>> GetMyFollowing()
    {
        var userId = GetCurrentUserId();
        var query = new GetMyFollowingQuery { UserId = userId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
