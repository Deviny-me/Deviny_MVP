using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class UserAchievement : BaseEntity
{
    public required Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public required Guid AchievementId { get; set; }
    public Achievement Achievement { get; set; } = null!;
    
    public required DateTime AwardedAt { get; set; }
    public required AchievementSourceType SourceType { get; set; }
    public Guid? SourceId { get; set; }
}
