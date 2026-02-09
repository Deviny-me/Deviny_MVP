using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for PostComment entity.
/// Supports threaded replies and soft delete.
/// </summary>
public class PostCommentConfiguration : IEntityTypeConfiguration<PostComment>
{
    public void Configure(EntityTypeBuilder<PostComment> builder)
    {
        builder.ToTable("PostComments");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Content)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(c => c.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.UpdatedAt)
            .IsRequired();

        // Post relationship - cascade delete when post is deleted
        builder.HasOne(c => c.Post)
            .WithMany(p => p.Comments)
            .HasForeignKey(c => c.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        // User relationship - restrict delete to preserve comment author
        builder.HasOne(c => c.User)
            .WithMany(u => u.PostComments)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Self-reference for threaded replies
        builder.HasOne(c => c.ParentComment)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Index for paginated comments on a post (ordered by date)
        builder.HasIndex(c => new { c.PostId, c.CreatedAt })
            .IsDescending(false, false)
            .HasDatabaseName("IX_PostComments_Post_CreatedAt");

        // Index for getting all comments by a user
        builder.HasIndex(c => c.UserId)
            .HasDatabaseName("IX_PostComments_UserId");

        // Index for thread queries
        builder.HasIndex(c => c.ParentCommentId)
            .HasDatabaseName("IX_PostComments_ParentCommentId");
    }
}
