namespace Deviny.Domain.Entities;

public class UserSettings : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    /// <summary>
    /// Theme preference: "light" or "dark"
    /// </summary>
    public string Theme { get; set; } = "light";
    
    /// <summary>
    /// Language preference (nullable for future use)
    /// </summary>
    public string? Language { get; set; }

    /// <summary>
    /// Master switch for all notifications.
    /// </summary>
    public bool NotificationsEnabled { get; set; } = true;

    public bool WorkoutRemindersEnabled { get; set; } = true;
    public bool AchievementFeedEnabled { get; set; } = true;
    public bool ContentUpdatesEnabled { get; set; } = true;
    public bool MessagingEnabled { get; set; } = true;
}
