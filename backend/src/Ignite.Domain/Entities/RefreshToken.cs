namespace Ignite.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public required Guid UserId { get; set; }
    public required string Token { get; set; } = string.Empty;
    public required DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public required bool IsRememberMe { get; set; }
    
    public User User { get; set; } = null!;
}
