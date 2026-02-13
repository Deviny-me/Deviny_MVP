using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class ScheduleEvent : BaseEntity
{
    public required Guid TrainerId { get; set; }
    public User? Trainer { get; set; }

    public Guid? StudentId { get; set; }
    public User? Student { get; set; }

    public required DateTime StartAt { get; set; }
    public required int DurationMinutes { get; set; }
    
    public required ScheduleEventType Type { get; set; }
    public required string Title { get; set; }
    public string? Location { get; set; }
    
    public required ScheduleEventStatus Status { get; set; }
    
    public Guid? ProgramId { get; set; }
    
    public string? Comment { get; set; }
    public bool IsCancelled { get; set; }

    public ICollection<CallSession> CallSessions { get; set; } = new List<CallSession>();
}
