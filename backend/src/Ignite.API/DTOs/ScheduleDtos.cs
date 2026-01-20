using Ignite.Domain.Enums;

namespace Ignite.API.DTOs;

public class ScheduleEventDto
{
    public Guid Id { get; set; }
    public Guid TrainerId { get; set; }
    public string? TrainerName { get; set; }
    public Guid? StudentId { get; set; }
    public string? StudentName { get; set; }
    public DateTime StartAt { get; set; }
    public int DurationMinutes { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Location { get; set; }
    public string Status { get; set; } = null!;
    public Guid? ProgramId { get; set; }
    public string? Comment { get; set; }
    public bool IsCancelled { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateScheduleEventRequest
{
    public Guid? StudentId { get; set; }
    public required DateTime StartAt { get; set; }
    public required int DurationMinutes { get; set; }
    public required string Type { get; set; }
    public required string Title { get; set; }
    public string? Location { get; set; }
    public string? Status { get; set; }
    public Guid? ProgramId { get; set; }
    public string? Comment { get; set; }
}

public class RescheduleEventRequest
{
    public required DateTime StartAt { get; set; }
    public required int DurationMinutes { get; set; }
}

public class UpdateScheduleEventRequest
{
    public Guid? StudentId { get; set; }
    public required DateTime StartAt { get; set; }
    public required int DurationMinutes { get; set; }
    public required string Type { get; set; }
    public required string Title { get; set; }
    public string? Location { get; set; }
    public string? Status { get; set; }
    public Guid? ProgramId { get; set; }
    public string? Comment { get; set; }
}

public class GetEventsQuery
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

public class ScheduleStatsResponse
{
    public int TotalEvents { get; set; }
    public int CompletedEvents { get; set; }
    public int UpcomingEvents { get; set; }
    public int CancelledEvents { get; set; }
    public int TotalMinutes { get; set; }
    public Dictionary<string, int> EventsByType { get; set; } = new();
    public List<DayStats> DayStats { get; set; } = new();
}

public class DayStats
{
    public DateTime Date { get; set; }
    public int EventCount { get; set; }
    public int TotalMinutes { get; set; }
}

public class StartCallResponse
{
    public string CallUrl { get; set; } = null!;
    public string RoomId { get; set; } = null!;
    public Guid SessionId { get; set; }
}
