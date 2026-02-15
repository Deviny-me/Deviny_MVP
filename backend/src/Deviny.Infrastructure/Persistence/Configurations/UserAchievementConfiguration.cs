using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class UserAchievementConfiguration : IEntityTypeConfiguration<UserAchievement>
{
    public void Configure(EntityTypeBuilder<UserAchievement> builder)
    {
        builder.HasKey(ua => ua.Id);
        
        builder.HasIndex(ua => new { ua.UserId, ua.AchievementId })
            .IsUnique();
        
        builder.Property(ua => ua.SourceType)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        builder.HasOne(ua => ua.User)
            .WithMany(u => u.Achievements)
            .HasForeignKey(ua => ua.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasOne(ua => ua.Achievement)
            .WithMany(a => a.UserAchievements)
            .HasForeignKey(ua => ua.AchievementId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasIndex(ua => ua.UserId);
        builder.HasIndex(ua => ua.AwardedAt);
    }
}
