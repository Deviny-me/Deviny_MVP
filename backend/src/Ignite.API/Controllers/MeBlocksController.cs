using Ignite.Application.Features.Friends.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ignite.API.Controllers;

[Route("api/me/blocks")]
public class MeBlocksController : BaseApiController
{
    private readonly IMediator _mediator;

    public MeBlocksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    [HttpPost("{userId}")]
    public async Task<IActionResult> BlockUser(Guid userId)
    {
        var blockerId = GetUserId();
        var command = new BlockUserCommand
        {
            BlockerId = blockerId,
            BlockedUserId = userId
        };

        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> UnblockUser(Guid userId)
    {
        var blockerId = GetUserId();
        var command = new UnblockUserCommand
        {
            BlockerId = blockerId,
            BlockedUserId = userId
        };

        await _mediator.Send(command);
        return NoContent();
    }
}
