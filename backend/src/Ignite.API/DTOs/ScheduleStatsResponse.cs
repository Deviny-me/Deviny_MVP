namespace Ignite.API.DTOs;

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
