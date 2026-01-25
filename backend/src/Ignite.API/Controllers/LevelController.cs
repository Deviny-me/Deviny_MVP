using System.Security.Claims;
using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Levels.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ignite.API.Controllers;

[ApiController]
[Route("api/me/level")]
[Authorize]
public class LevelController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILevelService _levelService;

    public LevelController(IMediator mediator, ILevelService levelService)
    {
        _mediator = mediator;
        _levelService = levelService;
    }

    [HttpGet]
    public async Task<ActionResult<UserLevelDto>> GetMyLevel()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var query = new GetMyLevelQuery { UserId = userId };
        var result = await _mediator.Send(query);
        
        return Ok(result);
    }
}
