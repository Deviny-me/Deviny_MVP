namespace Deviny.API.DTOs;

public class AchievementDto
{
    public required Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Subtitle { get; set; }
    public required string IconKey { get; set; }
    public required string Tone { get; set; }
}
