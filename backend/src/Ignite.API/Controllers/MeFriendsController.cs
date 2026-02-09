using Ignite.Application.DTOs;
using Ignite.Application.Features.Friends.Commands;
using Ignite.Application.Features.Friends.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ignite.API.Controllers;

[Route("api/me/friends")]
public class MeFriendsController : BaseApiController
{
    private readonly IMediator _mediator;

    public MeFriendsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    [HttpPost("requests")]
    public async Task<ActionResult<FriendRequestDto>> SendFriendRequest([FromBody] SendFriendRequestDto dto)
    {
        var userId = GetUserId();
        var command = new SendFriendRequestCommand
        {
            SenderId = userId,
            ReceiverId = dto.ReceiverId
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpGet("requests/incoming")]
    public async Task<ActionResult<List<FriendRequestDto>>> GetIncomingRequests()
    {
        var userId = GetUserId();
        var query = new GetIncomingRequestsQuery { UserId = userId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("requests/outgoing")]
    public async Task<ActionResult<List<FriendRequestDto>>> GetOutgoingRequests()
    {
        var userId = GetUserId();
        var query = new GetOutgoingRequestsQuery { UserId = userId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("requests/{requestId}/accept")]
    public async Task<IActionResult> AcceptFriendRequest(int requestId)
    {
        var userId = GetUserId();
        var command = new AcceptFriendRequestCommand
        {
            UserId = userId,
            RequestId = requestId
        };

        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPost("requests/{requestId}/decline")]
    public async Task<IActionResult> DeclineFriendRequest(int requestId)
    {
        var userId = GetUserId();
        var command = new DeclineFriendRequestCommand
        {
            UserId = userId,
            RequestId = requestId
        };

        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("requests/{requestId}")]
    public async Task<IActionResult> CancelFriendRequest(int requestId)
    {
        var userId = GetUserId();
        var command = new CancelFriendRequestCommand
        {
            UserId = userId,
            RequestId = requestId
        };

        await _mediator.Send(command);
        return NoContent();
    }

    [HttpGet]
    public async Task<ActionResult<List<FriendDto>>> GetMyFriends()
    {
        var userId = GetUserId();
        var query = new GetMyFriendsQuery { UserId = userId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpDelete("{friendId}")]
    public async Task<IActionResult> RemoveFriend(Guid friendId)
    {
        var userId = GetUserId();
        var command = new RemoveFriendCommand
        {
            UserId = userId,
            FriendId = friendId
        };

        await _mediator.Send(command);
        return NoContent();
    }
}
