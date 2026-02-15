using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class UserChallengeProgress : BaseEntity
{
    public required Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public required Guid ChallengeId { get; set; }
    public Challenge Challenge { get; set; } = null!;
    
    public int CurrentValue { get; set; } = 0;
    public required ChallengeStatus Status { get; set; } = ChallengeStatus.Active;
    public DateTime? CompletedAt { get; set; }
}
