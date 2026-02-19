using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class Challenge : BaseEntity
{
    public required string Code { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required ChallengeType Type { get; set; } = ChallengeType.OneTime;
    public int TargetValue { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// null = available for all roles, specific role = only for that role.
    /// Student is treated as User.
    /// </summary>
    public UserRole? TargetRole { get; set; }
    
    /// <summary>
    /// The achievement awarded upon challenge completion.
    /// </summary>
    public Guid? AchievementId { get; set; }
    public Achievement? Achievement { get; set; }
    
    // Navigation
    public ICollection<UserChallengeProgress> UserProgress { get; set; } = new List<UserChallengeProgress>();
}
