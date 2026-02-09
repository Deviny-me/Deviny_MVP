using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for PostLike entity.
/// Uses composite unique constraint to prevent duplicate likes.
/// </summary>
public class PostLikeConfiguration : IEntityTypeConfiguration<PostLike>
{
    public void Configure(EntityTypeBuilder<PostLike> builder)
    {
        builder.ToTable("PostLikes");

        builder.HasKey(pl => pl.Id);

        builder.Property(pl => pl.CreatedAt)
            .IsRequired();

        // Post relationship - cascade delete when post is deleted
        builder.HasOne(pl => pl.Post)
            .WithMany(p => p.Likes)
            .HasForeignKey(pl => pl.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        // User relationship - restrict delete to preserve user reference
        builder.HasOne(pl => pl.User)
            .WithMany(u => u.PostLikes)
            .HasForeignKey(pl => pl.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraint: A user can only like a post once
        builder.HasIndex(pl => new { pl.PostId, pl.UserId })
            .IsUnique()
            .HasDatabaseName("IX_PostLikes_Post_User_Unique");

        // Index for counting likes per post
        builder.HasIndex(pl => pl.PostId)
            .HasDatabaseName("IX_PostLikes_PostId");

        // Index for getting all likes by a user
        builder.HasIndex(pl => pl.UserId)
            .HasDatabaseName("IX_PostLikes_UserId");
    }
}
