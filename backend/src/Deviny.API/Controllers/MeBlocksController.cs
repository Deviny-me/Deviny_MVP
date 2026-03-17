using Deviny.Application.Features.Friends.Commands;
using Deviny.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/me/blocks")]
public class MeBlocksController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public MeBlocksController(IMediator mediator, IRealtimeNotifier realtimeNotifier)
    {
        _mediator = mediator;
        _realtimeNotifier = realtimeNotifier;
    }

    [HttpPost("{userId}")]
    public async Task<IActionResult> BlockUser(Guid userId)
    {
        var blockerId = GetCurrentUserId();
        var command = new BlockUserCommand
        {
            BlockerId = blockerId,
            BlockedUserId = userId
        };

        await _mediator.Send(command);

        await _realtimeNotifier.SendEntityChangedToUsersAsync(
            new[] { blockerId, userId },
            "friends",
            "blocked",
            "block",
            userId,
            new { blockerId, blockedUserId = userId });

        return NoContent();
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> UnblockUser(Guid userId)
    {
        var blockerId = GetCurrentUserId();
        var command = new UnblockUserCommand
        {
            BlockerId = blockerId,
            BlockedUserId = userId
        };

        await _mediator.Send(command);

        await _realtimeNotifier.SendEntityChangedToUsersAsync(
            new[] { blockerId, userId },
            "friends",
            "unblocked",
            "block",
            userId,
            new { blockerId, blockedUserId = userId });

        return NoContent();
    }
}
