using Deviny.Application.DTOs;
using Deviny.Application.Features.Friends.Commands;
using Deviny.Application.Features.Friends.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/me/friends")]
public class MeFriendsController : BaseApiController
{
    private readonly IMediator _mediator;

    public MeFriendsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("requests")]
    public async Task<ActionResult<FriendRequestDto>> SendFriendRequest([FromBody] SendFriendRequestDto dto)
    {
        var userId = GetCurrentUserId();
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
        var userId = GetCurrentUserId();
        var query = new GetIncomingRequestsQuery { UserId = userId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("requests/outgoing")]
    public async Task<ActionResult<List<FriendRequestDto>>> GetOutgoingRequests()
    {
        var userId = GetCurrentUserId();
        var query = new GetOutgoingRequestsQuery { UserId = userId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("requests/{requestId}/accept")]
    public async Task<IActionResult> AcceptFriendRequest(int requestId)
    {
        var userId = GetCurrentUserId();
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
        var userId = GetCurrentUserId();
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
        var userId = GetCurrentUserId();
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
        var userId = GetCurrentUserId();
        var query = new GetMyFriendsQuery { UserId = userId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpDelete("{friendId}")]
    public async Task<IActionResult> RemoveFriend(Guid friendId)
    {
        var userId = GetCurrentUserId();
        var command = new RemoveFriendCommand
        {
            UserId = userId,
            FriendId = friendId
        };

        await _mediator.Send(command);
        return NoContent();
    }

    [HttpGet("relationship/{targetUserId}")]
    public async Task<ActionResult<RelationshipStatusDto>> GetRelationshipStatus(Guid targetUserId)
    {
        var userId = GetCurrentUserId();
        var query = new GetRelationshipStatusQuery
        {
            CurrentUserId = userId,
            TargetUserId = targetUserId
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
