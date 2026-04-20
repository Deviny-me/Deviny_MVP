namespace Deviny.API.DTOs.Requests;

public class UpdateNotificationSettingsRequest
{
    public bool? NotificationsEnabled { get; set; }
    public bool? WorkoutRemindersEnabled { get; set; }
    public bool? AchievementFeedEnabled { get; set; }
    public bool? ContentUpdatesEnabled { get; set; }
    public bool? MessagingEnabled { get; set; }
}