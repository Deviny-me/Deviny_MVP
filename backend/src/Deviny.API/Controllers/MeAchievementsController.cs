using Deviny.Application.Features.Achievements.Queries;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/me/achievements")]
public class MeAchievementsController : BaseApiController
{
    private readonly IMediator _mediator;

    public MeAchievementsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get current user's achievements catalogue (locked + unlocked).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyAchievements(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var roleStr = GetCurrentUserRole();
        var role = Enum.TryParse<UserRole>(roleStr, true, out var parsed) ? parsed : UserRole.User;

        var result = await _mediator.Send(new GetMyAchievementsQuery { UserId = userId, UserRole = role }, ct);
        return Ok(result);
    }
}
