namespace Deviny.Domain.Entities;

public class UserLevel
{
    public Guid UserId { get; set; }
    public int CurrentLevel { get; set; } = 1;
    public int CurrentXp { get; set; } = 0;
    public int LifetimeXp { get; set; } = 0;
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLevelUpAt { get; set; }
    
    // Navigation
    public User User { get; set; } = null!;
}
