using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class UserSettingsConfiguration : IEntityTypeConfiguration<UserSettings>
{
    public void Configure(EntityTypeBuilder<UserSettings> builder)
    {
        builder.HasKey(e => e.Id);
        
        builder.HasIndex(e => e.UserId).IsUnique();
        
        builder.Property(e => e.Theme)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("light");
            
        builder.Property(e => e.Language)
            .HasMaxLength(10);

        builder.Property(e => e.NotificationsEnabled)
            .HasDefaultValue(true);

        builder.Property(e => e.WorkoutRemindersEnabled)
            .HasDefaultValue(true);

        builder.Property(e => e.AchievementFeedEnabled)
            .HasDefaultValue(true);

        builder.Property(e => e.ContentUpdatesEnabled)
            .HasDefaultValue(true);

        builder.Property(e => e.MessagingEnabled)
            .HasDefaultValue(true);
            
        builder.HasOne(e => e.User)
            .WithOne(u => u.Settings)
            .HasForeignKey<UserSettings>(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
