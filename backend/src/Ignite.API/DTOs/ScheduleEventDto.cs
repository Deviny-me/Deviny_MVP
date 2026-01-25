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
