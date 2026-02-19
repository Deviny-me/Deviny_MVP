using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class Achievement : BaseEntity
{
    public required string Code { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string IconKey { get; set; } = "trophy";
    public required string ColorKey { get; set; } = "yellow";
    public required AchievementRarity Rarity { get; set; } = AchievementRarity.Common;
    public int XpReward { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// null = available for all roles, specific role = only for that role.
    /// Student is treated as User.
    /// </summary>
    public UserRole? TargetRole { get; set; }
    
    // Navigation
    public ICollection<UserAchievement> UserAchievements { get; set; } = new List<UserAchievement>();
    public Challenge? Challenge { get; set; }
}
