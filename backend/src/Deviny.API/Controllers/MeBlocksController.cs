using Deviny.Application.Features.Friends.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/me/blocks")]
public class MeBlocksController : BaseApiController
{
    private readonly IMediator _mediator;

    public MeBlocksController(IMediator mediator)
    {
        _mediator = mediator;
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
        return NoContent();
    }
}
