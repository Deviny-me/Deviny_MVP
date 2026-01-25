using Ignite.Domain.Enums;

namespace Ignite.Application.Common.Interfaces;

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

public class AddXpResult
{
    public bool Success { get; set; }
    public bool WasAlreadyProcessed { get; set; }
    public bool LeveledUp { get; set; }
    public int NewLevel { get; set; }
    public int XpAdded { get; set; }
    public UserLevelDto CurrentState { get; set; } = null!;
}

public interface ILevelService
{
    Task<AddXpResult> AddXpAsync(Guid userId, XpEventType eventType, int xpAmount, string idempotencyKey, Guid? sourceEntityId = null);
    Task<UserLevelDto> GetUserLevelAsync(Guid userId);
    Task EnsureUserLevelExistsAsync(Guid userId);
}
