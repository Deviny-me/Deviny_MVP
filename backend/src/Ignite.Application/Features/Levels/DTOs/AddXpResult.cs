namespace Ignite.Application.Features.Levels.DTOs;

public class AddXpResult
{
    public bool Success { get; set; }
    public bool WasAlreadyProcessed { get; set; }
    public bool LeveledUp { get; set; }
    public int NewLevel { get; set; }
    public int XpAdded { get; set; }
    public UserLevelDto CurrentState { get; set; } = null!;
}
