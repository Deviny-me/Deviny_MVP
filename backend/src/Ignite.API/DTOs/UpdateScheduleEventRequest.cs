namespace Ignite.API.DTOs;

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
