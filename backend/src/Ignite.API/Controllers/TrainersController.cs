using Ignite.Application.Features.Trainers.DTOs;
using Ignite.Application.Features.Trainers.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ignite.API.Controllers;

[ApiController]
[Route("api/trainers")]
[Authorize]
public class TrainersController : ControllerBase
{
    private readonly IMediator _mediator;

    public TrainersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all trainers for browsing
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PublicTrainerDto>>> GetAll()
    {
        var query = new GetAllTrainersQuery();
        var trainers = await _mediator.Send(query);
        return Ok(trainers);
    }
}
