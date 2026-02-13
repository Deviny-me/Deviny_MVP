using Deviny.API.DTOs;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Deviny.API.Controllers;

[Route("api/trainer/me/schedule")]
public class TrainerScheduleController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly ILevelService _levelService;

    public TrainerScheduleController(ApplicationDbContext context, ILevelService levelService)
    {
        _context = context;
        _levelService = levelService;
    }

    private async Task<Guid> GetTrainerIdAsync()
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.Role != UserRole.Trainer)
            throw new UnauthorizedAccessException();

        return user.Id;
    }

    [HttpGet("events")]
    public async Task<ActionResult<List<ScheduleEventDto>>> GetEvents([FromQuery] GetEventsQuery query)
    {
        try
        {
            var trainerId = await GetTrainerIdAsync();

            var eventsQuery = _context.ScheduleEvents
                .Include(e => e.Trainer)
                .Include(e => e.Student)
                .Where(e => e.TrainerId == trainerId);

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
            return StatusCode(500, new { message = "Error fetching events", error = ex.Message });
        }
    }

    [HttpGet("events/{id}")]
    public async Task<ActionResult<ScheduleEventDto>> GetEvent(Guid id)
    {
        try
        {
            var trainerId = await GetTrainerIdAsync();

            var evt = await _context.ScheduleEvents
                .Include(e => e.Trainer)
                .Include(e => e.Student)
                .Where(e => e.Id == id && e.TrainerId == trainerId)
                .FirstOrDefaultAsync();

            if (evt == null)
                return NotFound();

            var dto = new ScheduleEventDto
            {
                Id = evt.Id,
                TrainerId = evt.TrainerId,
                TrainerName = evt.Trainer != null ? evt.Trainer.FullName : null,
                StudentId = evt.StudentId,
                StudentName = evt.Student != null ? evt.Student.FullName : null,
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
            };

            return Ok(dto);
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
            var trainerId = await GetTrainerIdAsync();

            if (!Enum.TryParse<ScheduleEventType>(request.Type, out var eventType))
                return BadRequest(new { message = "Invalid event type" });

            var status = ScheduleEventStatus.Pending;
            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<ScheduleEventStatus>(request.Status, out var parsedStatus))
                status = parsedStatus;

            var endTime = request.StartAt.AddMinutes(request.DurationMinutes);
            var hasOverlap = await _context.ScheduleEvents
                .Where(e => e.TrainerId == trainerId && !e.IsCancelled)
                .Where(e => (e.StartAt < endTime && e.StartAt.AddMinutes(e.DurationMinutes) > request.StartAt))
                .AnyAsync();

            if (hasOverlap)
                return Conflict(new { message = "Event overlaps with existing event" });

            var evt = new ScheduleEvent
            {
                Id = Guid.NewGuid(),
                TrainerId = trainerId,
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

            // Award XP to trainer for scheduling a session
            await _levelService.AddXpAsync(
                trainerId,
                XpEventType.TrainerScheduledSession,
                20, // 20 XP for scheduling
                $"TrainerScheduledSession:{evt.Id}",
                evt.Id
            );

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

    [HttpPut("events/{id}/reschedule")]
    public async Task<ActionResult<ScheduleEventDto>> RescheduleEvent(Guid id, [FromBody] RescheduleEventRequest request)
    {
        try
        {
            var trainerId = await GetTrainerIdAsync();

            var evt = await _context.ScheduleEvents.FindAsync(id);
            if (evt == null || evt.TrainerId != trainerId)
                return NotFound();

            var endTime = request.StartAt.AddMinutes(request.DurationMinutes);
            var hasOverlap = await _context.ScheduleEvents
                .Where(e => e.Id != id && e.TrainerId == trainerId && !e.IsCancelled)
                .Where(e => (e.StartAt < endTime && e.StartAt.AddMinutes(e.DurationMinutes) > request.StartAt))
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

    [HttpPut("events/{id}")]
    public async Task<ActionResult<ScheduleEventDto>> UpdateEvent(Guid id, [FromBody] UpdateScheduleEventRequest request)
    {
        try
        {
            var trainerId = await GetTrainerIdAsync();

            var evt = await _context.ScheduleEvents.FindAsync(id);
            if (evt == null || evt.TrainerId != trainerId)
                return NotFound();

            if (!Enum.TryParse<ScheduleEventType>(request.Type, out var eventType))
                return BadRequest(new { message = "Invalid event type" });

            var status = ScheduleEventStatus.Pending;
            if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<ScheduleEventStatus>(request.Status, out var parsedStatus))
                status = parsedStatus;

            var endTime = request.StartAt.AddMinutes(request.DurationMinutes);
            var hasOverlap = await _context.ScheduleEvents
                .Where(e => e.Id != id && e.TrainerId == trainerId && !e.IsCancelled)
                .Where(e => (e.StartAt < endTime && e.StartAt.AddMinutes(e.DurationMinutes) > request.StartAt))
                .AnyAsync();

            if (hasOverlap)
                return Conflict(new { message = "Event overlaps with existing event" });

            // Check if status changed to Completed to award XP
            var wasCompleted = evt.Status == ScheduleEventStatus.Completed;
            var isNowCompleted = status == ScheduleEventStatus.Completed;

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

            // Award XP if session was just completed
            if (!wasCompleted && isNowCompleted)
            {
                await _levelService.AddXpAsync(
                    trainerId,
                    XpEventType.TrainerCompletedCallSession,
                    30, // 30 XP for completing a session
                    $"TrainerCompletedCallSession:{evt.Id}",
                    evt.Id
                );
            }

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

    [HttpDelete("events/{id}")]
    public async Task<ActionResult> CancelEvent(Guid id)
    {
        try
        {
            var trainerId = await GetTrainerIdAsync();

            var evt = await _context.ScheduleEvents.FindAsync(id);
            if (evt == null || evt.TrainerId != trainerId)
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

    [HttpPost("events/{id}/start-call")]
    public async Task<ActionResult<StartCallResponse>> StartCall(Guid id)
    {
        try
        {
            var trainerId = await GetTrainerIdAsync();

            var evt = await _context.ScheduleEvents.FindAsync(id);
            if (evt == null || evt.TrainerId != trainerId)
                return NotFound();

            if (evt.Type != ScheduleEventType.Online)
                return BadRequest(new { message = "Only online events can start calls" });

            var roomId = Guid.NewGuid().ToString("N").Substring(0, 12);
            var callUrl = $"https://meet.Deviny.app/{roomId}";

            var session = new CallSession
            {
                Id = Guid.NewGuid(),
                EventId = evt.Id,
                TrainerId = evt.TrainerId,
                StudentId = evt.StudentId,
                Status = CallSessionStatus.Active,
                CallUrl = callUrl,
                RoomId = roomId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CallSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(new StartCallResponse
            {
                CallUrl = callUrl,
                RoomId = roomId,
                SessionId = session.Id
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error starting call", error = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ScheduleStatsResponse>> GetStats([FromQuery] DateTime? weekStart)
    {
        try
        {
            var trainerId = await GetTrainerIdAsync();

            var start = weekStart ?? DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
            var end = start.AddDays(7);

            var events = await _context.ScheduleEvents
                .Where(e => e.TrainerId == trainerId && e.StartAt >= start && e.StartAt < end)
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
