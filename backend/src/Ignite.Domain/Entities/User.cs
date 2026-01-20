using Ignite.Domain.Enums;

namespace Ignite.Domain.Entities;

public class User : BaseEntity
{
    public required string Email { get; set; } = string.Empty;
    public required string PasswordHash { get; set; } = string.Empty;
    public required string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Slug { get; set; }
    public string Theme { get; set; } = "light";
    public bool PushNotificationsEnabled { get; set; } = false;
    public required UserRole Role { get; set; }
    public required bool IsEmailConfirmed { get; set; }
    public required bool IsActive { get; set; } = true;
    
    // Navigation properties
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public UserSettings? Settings { get; set; }
    public TrainerProfile? TrainerProfile { get; set; }
}
