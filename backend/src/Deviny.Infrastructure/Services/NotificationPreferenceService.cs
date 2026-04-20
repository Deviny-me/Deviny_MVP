using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Deviny.Infrastructure.Services;

public class NotificationPreferenceService : INotificationPreferenceService
{
    private readonly ApplicationDbContext _context;

    public NotificationPreferenceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CanReceiveAsync(Guid userId, NotificationType type, CancellationToken ct = default)
    {
        var settings = await _context.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        // Backward-compatible default for existing users with no settings row yet.
        if (settings == null)
        {
            return true;
        }

        if (!settings.NotificationsEnabled)
        {
            return false;
        }

        return type.GetCategory() switch
        {
            NotificationCategory.WorkoutReminders => settings.WorkoutRemindersEnabled,
            NotificationCategory.AchievementFeed => settings.AchievementFeedEnabled,
            NotificationCategory.ContentUpdates => settings.ContentUpdatesEnabled,
            NotificationCategory.Messaging => settings.MessagingEnabled,
            _ => true
        };
    }
}