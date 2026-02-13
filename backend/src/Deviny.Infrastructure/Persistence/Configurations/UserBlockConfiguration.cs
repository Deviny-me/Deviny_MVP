using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class UserBlockConfiguration : IEntityTypeConfiguration<UserBlock>
{
    public void Configure(EntityTypeBuilder<UserBlock> builder)
    {
        builder.ToTable("UserBlocks");

        builder.HasKey(ub => ub.Id);

        builder.Property(ub => ub.CreatedAt)
            .IsRequired();

        builder.HasOne(ub => ub.Blocker)
            .WithMany(u => u.BlockedUsers)
            .HasForeignKey(ub => ub.BlockerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ub => ub.BlockedUser)
            .WithMany(u => u.BlockedByUsers)
            .HasForeignKey(ub => ub.BlockedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraint: A user can only block another user once
        builder.HasIndex(ub => new { ub.BlockerId, ub.BlockedUserId })
            .IsUnique()
            .HasDatabaseName("IX_UserBlocks_Blocker_Blocked_Unique");

        builder.HasIndex(ub => ub.BlockedUserId)
            .HasDatabaseName("IX_UserBlocks_BlockedUser");
    }
}
