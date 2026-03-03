using Deviny.Application.Common;
using Deviny.Application.Features.MealPrograms.DTOs;
using Deviny.Application.Features.MealPrograms.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/meal-programs")]
public class MealProgramsController : BaseApiController
{
    private readonly IMediator _mediator;

    public MealProgramsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all public meal programs for browsing (paginated)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResponse<PublicMealProgramDto>>> GetAllPublic(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 100) pageSize = 100;

        var query = new GetAllPublicMealProgramsQuery(page, pageSize);
        var programs = await _mediator.Send(query);
        return Ok(programs);
    }
}
