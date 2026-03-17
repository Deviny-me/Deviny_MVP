using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class User : BaseEntity
{
    public required string Email { get; set; } = string.Empty;
    public required string PasswordHash { get; set; } = string.Empty;
    public required string FirstName { get; set; } = string.Empty;
    public required string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? Slug { get; set; }
    public bool PushNotificationsEnabled { get; set; } = false;
    public required UserRole Role { get; set; }
    public required bool IsEmailConfirmed { get; set; }
    public required bool IsActive { get; set; } = true;
    
    // Extended registration fields (primarily for trainers)
    public Gender? Gender { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? Bio { get; set; }
    
    // Computed property for backward compatibility
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    // Navigation properties
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public UserSettings? Settings { get; set; }
    public TrainerProfile? TrainerProfile { get; set; }
    public ICollection<VerificationDocument> VerificationDocuments { get; set; } = new List<VerificationDocument>();
    
    // Friends and social navigation properties
    public ICollection<FriendRequest> SentFriendRequests { get; set; } = new List<FriendRequest>();
    public ICollection<FriendRequest> ReceivedFriendRequests { get; set; } = new List<FriendRequest>();
    public ICollection<UserFollow> Following { get; set; } = new List<UserFollow>();
    public ICollection<UserFollow> Followers { get; set; } = new List<UserFollow>();
    public ICollection<UserBlock> BlockedUsers { get; set; } = new List<UserBlock>();
    public ICollection<UserBlock> BlockedByUsers { get; set; } = new List<UserBlock>();
    
    // Content navigation properties
    public ICollection<UserPost> Posts { get; set; } = new List<UserPost>();
    public ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();
    public ICollection<PostComment> PostComments { get; set; } = new List<PostComment>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<ConversationMember> ConversationMemberships { get; set; } = new List<ConversationMember>();
    
    // Programs navigation properties
    public ICollection<ProgramPurchase> ProgramPurchases { get; set; } = new List<ProgramPurchase>();
    public ICollection<ProgramReview> ProgramReviews { get; set; } = new List<ProgramReview>();
    
    // Achievements & Challenges navigation properties
    public ICollection<UserAchievement> Achievements { get; set; } = new List<UserAchievement>();
    public ICollection<UserChallengeProgress> ChallengeProgress { get; set; } = new List<UserChallengeProgress>();

    // Feedback navigation property (one-to-one with Trainer)
    public Feedback Feedback { get; set; } = new Feedback(); 
}
