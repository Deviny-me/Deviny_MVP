using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class UserFollowConfiguration : IEntityTypeConfiguration<UserFollow>
{
    public void Configure(EntityTypeBuilder<UserFollow> builder)
    {
        builder.ToTable("UserFollows");

        builder.HasKey(uf => uf.Id);

        builder.Property(uf => uf.CreatedAt)
            .IsRequired();

        builder.HasOne(uf => uf.Follower)
            .WithMany(u => u.Following)
            .HasForeignKey(uf => uf.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(uf => uf.Trainer)
            .WithMany(u => u.Followers)
            .HasForeignKey(uf => uf.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraint: A user can only follow a trainer once
        builder.HasIndex(uf => new { uf.FollowerId, uf.TrainerId })
            .IsUnique()
            .HasDatabaseName("IX_UserFollows_Follower_Trainer_Unique");

        builder.HasIndex(uf => uf.TrainerId)
            .HasDatabaseName("IX_UserFollows_Trainer");

        builder.HasIndex(uf => uf.CreatedAt)
            .HasDatabaseName("IX_UserFollows_CreatedAt");
    }
}
