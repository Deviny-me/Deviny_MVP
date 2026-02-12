using Ignite.Application.Features.Levels.DTOs;
using Ignite.Application.Features.Levels.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ignite.API.Controllers;

[Route("api/me")]
public class LevelController : BaseApiController
{
    private readonly IMediator _mediator;

    public LevelController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("level")]
    public async Task<ActionResult<UserLevelDto>> GetMyLevel()
    {
        var userId = GetCurrentUserId();

        var query = new GetMyLevelQuery { UserId = userId };
        var result = await _mediator.Send(query);
        
        return Ok(result);
    }
}
