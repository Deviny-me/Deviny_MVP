namespace Deviny.Application.Features.Levels.DTOs;

public class UserLevelDto
{
    public int CurrentLevel { get; set; }
    public int CurrentXp { get; set; }
    public int XpToNextLevel { get; set; }
    public int RequiredXpForNextLevel { get; set; }
    public double ProgressPercent { get; set; }
    public int LifetimeXp { get; set; }
    public string? LevelTitle { get; set; }
    public string? NextLevelTitle { get; set; }
}
