using Deviny.API.DTOs;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Deviny.API.Controllers;

[Route("api/user/me/schedule")]
public class UserScheduleController : BaseApiController
{
    private readonly ApplicationDbContext _context;

    public UserScheduleController(ApplicationDbContext context)
    {
        _context = context;
    }

    private async Task<Guid> GetUserIdAsync()
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.Role != UserRole.User)
            throw new UnauthorizedAccessException();
        return user.Id;
    }

    [HttpGet("events")]
    public async Task<ActionResult<List<ScheduleEventDto>>> GetEvents([FromQuery] GetEventsQuery query)
    {
        try
        {
            var userId = await GetUserIdAsync();

            var eventsQuery = _context.ScheduleEvents
                .AsNoTracking()
                .Include(e => e.Trainer)
                .Include(e => e.Student)
                .Where(e => (e.TrainerId == userId || e.StudentId == userId) && !e.IsCancelled);

            if (query.From.HasValue)
                eventsQuery = eventsQuery.Where(e => e.StartAt >= query.From.Value);

            if (query.To.HasValue)
                eventsQuery = eventsQuery.Where(e => e.StartAt < query.To.Value);

            var events = await eventsQuery
                .OrderBy(e => e.StartAt)
                .Select(e => new ScheduleEventDto
                {
                    Id = e.Id,
                    TrainerId = e.TrainerId,
                    TrainerName = e.Trainer != null ? e.Trainer.FirstName + " " + e.Trainer.LastName : null,
                    StudentId = e.StudentId,
                    StudentName = e.Student != null ? e.Student.FirstName + " " + e.Student.LastName : null,
                    StartAt = e.StartAt,
                    DurationMinutes = e.DurationMinutes,
                    Type = e.Type.ToString(),
                    Title = e.Title,
                    Location = e.Location,
                    Status = e.Status.ToString(),
                    ProgramId = e.ProgramId,
                    Comment = e.Comment,
                    IsCancelled = e.IsCancelled,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(events);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching schedule", error = ex.Message });
        }
    }

    [HttpGet("events/{id}")]
    public async Task<ActionResult<ScheduleEventDto>> GetEvent(Guid id)
    {
        try
        {
            var userId = await GetUserIdAsync();

            var evt = await _context.ScheduleEvents
                .AsNoTracking()
                .Include(e => e.Trainer)
                .Include(e => e.Student)
                .Where(e => e.Id == id && (e.TrainerId == userId || e.StudentId == userId))
                .FirstOrDefaultAsync();

            if (evt == null)
                return NotFound();

            return Ok(new ScheduleEventDto
            {
                Id = evt.Id,
                TrainerId = evt.TrainerId,
                TrainerName = evt.Trainer != null ? evt.Trainer.FirstName + " " + evt.Trainer.LastName : null,
                StudentId = evt.StudentId,
                StudentName = evt.Student != null ? evt.Student.FirstName + " " + evt.Student.LastName : null,
                StartAt = evt.StartAt,
                DurationMinutes = evt.DurationMinutes,
                Type = evt.Type.ToString(),
                Title = evt.Title,
                Location = evt.Location,
                Status = evt.Status.ToString(),
                ProgramId = evt.ProgramId,
                Comment = evt.Comment,
                IsCancelled = evt.IsCancelled,
                CreatedAt = evt.CreatedAt
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching event", error = ex.Message });
        }
    }

    [HttpPost("events")]
    public async Task<ActionResult<ScheduleEventDto>> CreateEvent([FromBody] CreateScheduleEventRequest request)
    {
        try
        {
            var userId = await GetUserIdAsync();

            if (!Enum.TryParse<ScheduleEventType>(request.Type, out var eventType))
                return BadRequest(new { message = "Invalid event type" });

            var status = ScheduleEventStatus.Pending;
            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<ScheduleEventStatus>(request.Status, out var parsedStatus))
                status = parsedStatus;

            var endTime = request.StartAt.AddMinutes(request.DurationMinutes);
            var hasOverlap = await _context.ScheduleEvents
                .Where(e => e.TrainerId == userId && !e.IsCancelled)
                .Where(e => e.StartAt < endTime && e.StartAt.AddMinutes(e.DurationMinutes) > request.StartAt)
                .AnyAsync();

            if (hasOverlap)
                return Conflict(new { message = "Event overlaps with existing event" });

            var evt = new ScheduleEvent
            {
                Id = Guid.NewGuid(),
                TrainerId = userId,
                StudentId = request.StudentId,
                StartAt = request.StartAt,
                DurationMinutes = request.DurationMinutes,
                Type = eventType,
                Title = request.Title,
                Location = request.Location,
                Status = status,
                ProgramId = request.ProgramId,
                Comment = request.Comment,
                IsCancelled = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ScheduleEvents.Add(evt);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEvent), new { id = evt.Id }, new ScheduleEventDto
            {
                Id = evt.Id,
                TrainerId = evt.TrainerId,
                StudentId = evt.StudentId,
                StartAt = evt.StartAt,
                DurationMinutes = evt.DurationMinutes,
                Type = evt.Type.ToString(),
                Title = evt.Title,
                Location = evt.Location,
                Status = evt.Status.ToString(),
                ProgramId = evt.ProgramId,
                Comment = evt.Comment,
                IsCancelled = evt.IsCancelled,
                CreatedAt = evt.CreatedAt
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error creating event", error = ex.Message });
        }
    }

    [HttpPut("events/{id}")]
    public async Task<ActionResult<ScheduleEventDto>> UpdateEvent(Guid id, [FromBody] UpdateScheduleEventRequest request)
    {
        try
        {
            var userId = await GetUserIdAsync();

            var evt = await _context.ScheduleEvents.FindAsync(id);
            if (evt == null || evt.TrainerId != userId)
                return NotFound();

            if (!Enum.TryParse<ScheduleEventType>(request.Type, out var eventType))
                return BadRequest(new { message = "Invalid event type" });

            var status = ScheduleEventStatus.Pending;
            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<ScheduleEventStatus>(request.Status, out var parsedStatus))
                status = parsedStatus;

            var endTime = request.StartAt.AddMinutes(request.DurationMinutes);
            var hasOverlap = await _context.ScheduleEvents
                .Where(e => e.Id != id && e.TrainerId == userId && !e.IsCancelled)
                .Where(e => e.StartAt < endTime && e.StartAt.AddMinutes(e.DurationMinutes) > request.StartAt)
                .AnyAsync();

            if (hasOverlap)
                return Conflict(new { message = "Event overlaps with existing event" });

            evt.StudentId = request.StudentId;
            evt.StartAt = request.StartAt;
            evt.DurationMinutes = request.DurationMinutes;
            evt.Type = eventType;
            evt.Title = request.Title;
            evt.Location = request.Location;
            evt.Status = status;
            evt.ProgramId = request.ProgramId;
            evt.Comment = request.Comment;
            evt.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ScheduleEventDto
            {
                Id = evt.Id,
                TrainerId = evt.TrainerId,
                StudentId = evt.StudentId,
                StartAt = evt.StartAt,
                DurationMinutes = evt.DurationMinutes,
                Type = evt.Type.ToString(),
                Title = evt.Title,
                Location = evt.Location,
                Status = evt.Status.ToString(),
                ProgramId = evt.ProgramId,
                Comment = evt.Comment,
                IsCancelled = evt.IsCancelled,
                CreatedAt = evt.CreatedAt
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating event", error = ex.Message });
        }
    }

    [HttpPut("events/{id}/reschedule")]
    public async Task<ActionResult<ScheduleEventDto>> RescheduleEvent(Guid id, [FromBody] RescheduleEventRequest request)
    {
        try
        {
            var userId = await GetUserIdAsync();

            var evt = await _context.ScheduleEvents.FindAsync(id);
            if (evt == null || evt.TrainerId != userId)
                return NotFound();

            var endTime = request.StartAt.AddMinutes(request.DurationMinutes);
            var hasOverlap = await _context.ScheduleEvents
                .Where(e => e.Id != id && e.TrainerId == userId && !e.IsCancelled)
                .Where(e => e.StartAt < endTime && e.StartAt.AddMinutes(e.DurationMinutes) > request.StartAt)
                .AnyAsync();

            if (hasOverlap)
                return Conflict(new { message = "Event overlaps with existing event" });

            evt.StartAt = request.StartAt;
            evt.DurationMinutes = request.DurationMinutes;
            evt.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ScheduleEventDto
            {
                Id = evt.Id,
                TrainerId = evt.TrainerId,
                StudentId = evt.StudentId,
                StartAt = evt.StartAt,
                DurationMinutes = evt.DurationMinutes,
                Type = evt.Type.ToString(),
                Title = evt.Title,
                Location = evt.Location,
                Status = evt.Status.ToString(),
                ProgramId = evt.ProgramId,
                Comment = evt.Comment,
                IsCancelled = evt.IsCancelled,
                CreatedAt = evt.CreatedAt
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error rescheduling event", error = ex.Message });
        }
    }

    [HttpDelete("events/{id}")]
    public async Task<ActionResult> DeleteEvent(Guid id)
    {
        try
        {
            var userId = await GetUserIdAsync();

            var evt = await _context.ScheduleEvents.FindAsync(id);
            if (evt == null || evt.TrainerId != userId)
                return NotFound();

            evt.IsCancelled = true;
            evt.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error cancelling event", error = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ScheduleStatsResponse>> GetStats([FromQuery] DateTime? weekStart)
    {
        try
        {
            var userId = await GetUserIdAsync();

            var start = weekStart ?? DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
            var end = start.AddDays(7);

            var events = await _context.ScheduleEvents
                .AsNoTracking()
                .Where(e => (e.TrainerId == userId || e.StudentId == userId) && e.StartAt >= start && e.StartAt < end)
                .ToListAsync();

            var now = DateTime.UtcNow;

            var stats = new ScheduleStatsResponse
            {
                TotalEvents = events.Count,
                CompletedEvents = events.Count(e => e.StartAt.AddMinutes(e.DurationMinutes) < now && !e.IsCancelled),
                UpcomingEvents = events.Count(e => e.StartAt > now && !e.IsCancelled),
                CancelledEvents = events.Count(e => e.IsCancelled),
                TotalMinutes = events.Where(e => !e.IsCancelled).Sum(e => e.DurationMinutes),
                EventsByType = events.Where(e => !e.IsCancelled).GroupBy(e => e.Type.ToString()).ToDictionary(g => g.Key, g => g.Count()),
                DayStats = events.GroupBy(e => e.StartAt.Date)
                    .Select(g => new DayStats
                    {
                        Date = g.Key,
                        EventCount = g.Count(e => !e.IsCancelled),
                        TotalMinutes = g.Where(e => !e.IsCancelled).Sum(e => e.DurationMinutes)
                    })
                    .OrderBy(d => d.Date)
                    .ToList()
            };

            return Ok(stats);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching stats", error = ex.Message });
        }
    }
}
