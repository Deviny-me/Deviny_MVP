namespace Deviny.API.DTOs.Responses;

public record NotificationSettingsResponse(
    bool NotificationsEnabled,
    bool WorkoutRemindersEnabled,
    bool AchievementFeedEnabled,
    bool ContentUpdatesEnabled,
    bool MessagingEnabled);