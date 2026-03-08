using Deviny.API.DTOs;
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

    [HttpGet("events")]
    public async Task<ActionResult<List<ScheduleEventDto>>> GetEvents([FromQuery] GetEventsQuery query)
    {
        try
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.Role != UserRole.User)
                return Forbid();

            var eventsQuery = _context.ScheduleEvents
                .AsNoTracking()
                .Include(e => e.Trainer)
                .Where(e => e.StudentId == userId && !e.IsCancelled);

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
                    StudentName = null,
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

    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats([FromQuery] string? weekStart)
    {
        try
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.Role != UserRole.User)
                return Forbid();

            var startDate = DateTime.UtcNow.Date;
            if (!string.IsNullOrEmpty(weekStart) && DateTime.TryParse(weekStart, out var parsed))
                startDate = parsed;

            var endDate = startDate.AddDays(7);

            var events = await _context.ScheduleEvents
                .AsNoTracking()
                .Where(e => e.StudentId == userId && !e.IsCancelled && e.StartAt >= startDate && e.StartAt < endDate)
                .ToListAsync();

            return Ok(new
            {
                totalEvents = events.Count,
                completedEvents = 0,
                upcomingEvents = events.Count(e => e.StartAt > DateTime.UtcNow),
                cancelledEvents = 0,
                totalMinutes = events.Sum(e => e.DurationMinutes),
                eventsByType = events.GroupBy(e => e.Type.ToString()).ToDictionary(g => g.Key, g => g.Count()),
                dayStats = events.GroupBy(e => e.StartAt.Date).Select(g => new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    eventCount = g.Count(),
                    totalMinutes = g.Sum(e => e.DurationMinutes)
                }).ToList()
            });
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
