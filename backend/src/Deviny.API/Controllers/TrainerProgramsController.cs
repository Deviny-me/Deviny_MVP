using Deviny.Application.Features.Programs.Commands;
using Deviny.Application.Features.Programs.DTOs;
using Deviny.Application.Features.Programs.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/trainer/me/programs")]
public class TrainerProgramsController : BaseApiController
{
    private readonly IMediator _mediator;

    public TrainerProgramsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProgramDto>>> GetMyPrograms()
    {
        var trainerId = TryGetCurrentUserId();
        if (trainerId == null)
            return Unauthorized();

        var role = GetCurrentUserRole();
        if (role != "Trainer" && role != "1")
            return Forbid();

        var query = new GetMyProgramsQuery { TrainerId = trainerId.Value };
        var programs = await _mediator.Send(query);

        return Ok(programs);
    }

    [HttpPost]
    [RequestSizeLimit(200 * 1024 * 1024)] // 200MB max for cover + videos
    [RequestFormLimits(MultipartBodyLengthLimit = 200 * 1024 * 1024)]
    public async Task<ActionResult<ProgramDto>> CreateProgram([FromForm] CreateProgramRequest request)
    {
        var trainerId = TryGetCurrentUserId();
        if (trainerId == null)
            return Unauthorized();

        var role = GetCurrentUserRole();
        if (role != "Trainer" && role != "1")
            return Forbid();

        try
        {
            var command = new CreateProgramCommand
            {
                TrainerId = trainerId.Value,
                Title = request.Title,
                Description = request.Description,
                DetailedDescription = request.DetailedDescription,
                Price = request.Price,
                StandardPrice = request.StandardPrice,
                ProPrice = request.ProPrice,
                MaxStandardSpots = request.MaxStandardSpots,
                MaxProSpots = request.MaxProSpots,
                Category = request.Category,
                IsPublic = request.IsPublic,
                CoverImage = request.CoverImage,
                TrainingVideos = request.TrainingVideos,
                TrainingVideoTitles = request.TrainingVideoTitles,
                TrainingVideoDescriptions = request.TrainingVideoDescriptions
            };

            var program = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetMyPrograms), new { id = program.Id }, program);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            // Log the actual error for server-side debugging
            Console.Error.WriteLine($"CreateProgram error: {ex.GetType().Name}: {ex.Message}");
            Console.Error.WriteLine(ex.StackTrace);
            return StatusCode(500, new { message = "Failed to create program" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProgramDto>> UpdateProgram(Guid id, [FromForm] UpdateProgramRequest request)
    {
        var trainerId = TryGetCurrentUserId();
        if (trainerId == null)
            return Unauthorized();

        var role = GetCurrentUserRole();
        if (role != "Trainer" && role != "1")
            return Forbid();

        try
        {
            var command = new UpdateProgramCommand
            {
                Id = id,
                TrainerId = trainerId.Value,
                Title = request.Title,
                Description = request.Description,
                DetailedDescription = request.DetailedDescription,
                Price = request.Price,
                StandardPrice = request.StandardPrice,
                ProPrice = request.ProPrice,
                MaxStandardSpots = request.MaxStandardSpots,
                MaxProSpots = request.MaxProSpots,
                Category = request.Category,
                IsPublic = request.IsPublic,
                CoverImage = request.CoverImage,
                TrainingVideos = request.TrainingVideos,
                TrainingVideoTitles = request.TrainingVideoTitles,
                TrainingVideoDescriptions = request.TrainingVideoDescriptions
            };

            var program = await _mediator.Send(command);
            return Ok(program);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProgram(Guid id)
    {
        var trainerId = TryGetCurrentUserId();
        if (trainerId == null)
            return Unauthorized();

        var role = GetCurrentUserRole();
        if (role != "Trainer" && role != "1")
            return Forbid();

        try
        {
            var command = new DeleteProgramCommand
            {
                Id = id,
                TrainerId = trainerId.Value
            };

            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

}
