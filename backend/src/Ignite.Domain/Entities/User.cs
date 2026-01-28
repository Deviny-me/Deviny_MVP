using Ignite.Domain.Enums;

namespace Ignite.Domain.Entities;

public class User : BaseEntity
{
    public required string Email { get; set; } = string.Empty;
    public required string PasswordHash { get; set; } = string.Empty;
    public required string FirstName { get; set; } = string.Empty;
    public required string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Slug { get; set; }
    public bool PushNotificationsEnabled { get; set; } = false;
    public required UserRole Role { get; set; }
    public required bool IsEmailConfirmed { get; set; }
    public required bool IsActive { get; set; } = true;
    
    // Extended registration fields (primarily for trainers)
    public Gender? Gender { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    
    // Computed property for backward compatibility
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    // Navigation properties
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public UserSettings? Settings { get; set; }
    public TrainerProfile? TrainerProfile { get; set; }
    public ICollection<VerificationDocument> VerificationDocuments { get; set; } = new List<VerificationDocument>();
}
