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
    /// Get all public meal programs for browsing
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<PublicMealProgramDto>>> GetAllPublic()
    {
        var query = new GetAllPublicMealProgramsQuery();
        var programs = await _mediator.Send(query);
        return Ok(programs);
    }
}
