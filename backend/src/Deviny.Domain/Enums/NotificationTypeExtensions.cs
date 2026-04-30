namespace Deviny.Domain.Enums;

public static class NotificationTypeExtensions
{
    public static NotificationCategory GetCategory(this NotificationType type)
    {
        return type switch
        {
            NotificationType.AchievementUnlocked => NotificationCategory.AchievementFeed,
            NotificationType.TrainingProgramCreated => NotificationCategory.ContentUpdates,
            NotificationType.MealProgramCreated => NotificationCategory.ContentUpdates,
            NotificationType.MessageReceived => NotificationCategory.Messaging,
            NotificationType.IncomingCall => NotificationCategory.Messaging,
            NotificationType.WorkoutReminder => NotificationCategory.WorkoutReminders,
            NotificationType.System => NotificationCategory.System,
            NotificationType.FriendRequestReceived => NotificationCategory.System,
            NotificationType.FriendRequestAccepted => NotificationCategory.System,
            NotificationType.NewFollower => NotificationCategory.System,
            _ => NotificationCategory.System
        };
    }
}
