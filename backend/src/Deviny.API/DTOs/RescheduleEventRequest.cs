namespace Deviny.API.DTOs;

public class RescheduleEventRequest
{
    public required DateTime StartAt { get; set; }
    public required int DurationMinutes { get; set; }
}
