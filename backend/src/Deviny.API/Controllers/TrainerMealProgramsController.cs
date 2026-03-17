using Deviny.Application.Features.MealPrograms.Commands;
using Deviny.Application.Features.MealPrograms.DTOs;
using Deviny.Application.Features.MealPrograms.Queries;
using Deviny.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

/// <summary>
/// Meal program management. Accessible by Trainer and Nutritionist roles.
/// Trainer can create both TrainingProgram and MealProgram.
/// Nutritionist can only create MealProgram.
/// </summary>
[Route("api/trainer/me/meal-programs")]
public class TrainerMealProgramsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public TrainerMealProgramsController(IMediator mediator, IRealtimeNotifier realtimeNotifier)
    {
        _mediator = mediator;
        _realtimeNotifier = realtimeNotifier;
    }

    [HttpGet]
    public async Task<ActionResult<List<MealProgramDto>>> GetMyMealPrograms()
    {
        var userId = TryGetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var role = GetCurrentUserRole();
        if (role != "Trainer" && role != "1")
            return Forbid();

        var query = new GetMyMealProgramsQuery { TrainerId = userId.Value };
        var programs = await _mediator.Send(query);

        return Ok(programs);
    }

    [HttpPost]
    [RequestSizeLimit(200 * 1024 * 1024)] // 200MB max for cover + videos
    [RequestFormLimits(MultipartBodyLengthLimit = 200 * 1024 * 1024)]
    public async Task<ActionResult<MealProgramDto>> CreateMealProgram([FromForm] CreateMealProgramRequest request)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var role = GetCurrentUserRole();
        if (role != "Trainer" && role != "1")
            return Forbid();

        try
        {
            var command = new CreateMealProgramCommand
            {
                TrainerId = userId.Value,
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
                Videos = request.Videos
            };

            var program = await _mediator.Send(command);
            await _realtimeNotifier.SendGlobalEntityChangedAsync(
                "programs",
                "created",
                "meal-program",
                program.Id,
                new { trainerId = userId.Value });
            return CreatedAtAction(nameof(GetMyMealPrograms), new { id = program.Id }, program);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"CreateMealProgram error: {ex.GetType().Name}: {ex.Message}");
            Console.Error.WriteLine(ex.StackTrace);
            return StatusCode(500, new { message = "Failed to create meal program" });
        }
    }

    [HttpPut("{id}")]
    [RequestSizeLimit(200 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200 * 1024 * 1024)]
    public async Task<ActionResult<MealProgramDto>> UpdateMealProgram(Guid id, [FromForm] UpdateMealProgramRequest request)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var role = GetCurrentUserRole();
        if (role != "Trainer" && role != "1")
            return Forbid();

        try
        {
            var command = new UpdateMealProgramCommand
            {
                Id = id,
                TrainerId = userId.Value,
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
                Videos = request.Videos
            };

            var program = await _mediator.Send(command);
            await _realtimeNotifier.SendGlobalEntityChangedAsync(
                "programs",
                "updated",
                "meal-program",
                program.Id,
                new { trainerId = userId.Value });
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
    public async Task<ActionResult> DeleteMealProgram(Guid id)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var role = GetCurrentUserRole();
        if (role != "Trainer" && role != "1")
            return Forbid();

        try
        {
            var command = new DeleteMealProgramCommand
            {
                Id = id,
                TrainerId = userId.Value
            };

            await _mediator.Send(command);
            await _realtimeNotifier.SendGlobalEntityChangedAsync(
                "programs",
                "deleted",
                "meal-program",
                id,
                new { trainerId = userId.Value });
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
