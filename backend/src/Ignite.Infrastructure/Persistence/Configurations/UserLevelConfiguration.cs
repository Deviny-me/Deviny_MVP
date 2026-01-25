using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class UserLevelConfiguration : IEntityTypeConfiguration<UserLevel>
{
    public void Configure(EntityTypeBuilder<UserLevel> builder)
    {
        builder.HasKey(e => e.UserId);

        builder.Property(e => e.CurrentLevel)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(e => e.CurrentXp)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(e => e.LifetimeXp)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(e => e.UpdatedAt)
            .IsRequired();

        builder.HasOne(e => e.User)
            .WithOne()
            .HasForeignKey<UserLevel>(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index for potential leaderboard
        builder.HasIndex(e => e.CurrentLevel);
        builder.HasIndex(e => e.LifetimeXp);
    }
}
