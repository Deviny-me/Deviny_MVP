using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for UserPost entity.
/// Defines table structure, relationships, and indexes.
/// </summary>
public class UserPostConfiguration : IEntityTypeConfiguration<UserPost>
{
    public void Configure(EntityTypeBuilder<UserPost> builder)
    {
        builder.HasKey(p => p.Id);
        
        // User relationship - cascade delete when user is deleted
        builder.HasOne(p => p.User)
            .WithMany(u => u.Posts)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Self-reference for reposts - restrict delete to preserve original
        builder.HasOne(p => p.OriginalPost)
            .WithMany(p => p.Reposts)
            .HasForeignKey(p => p.OriginalPostId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Post type as string for readability in DB
        builder.Property(p => p.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);
        
        // Optional caption with max length
        builder.Property(p => p.Caption)
            .HasMaxLength(500);
        
        // Visibility enum as string
        builder.Property(p => p.Visibility)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(PostVisibility.Public);
        
        // Optional repost quote
        builder.Property(p => p.RepostQuote)
            .HasMaxLength(280);
        
        // Soft delete flag
        builder.Property(p => p.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);
        
        builder.Property(p => p.CreatedAt)
            .IsRequired();
        
        builder.Property(p => p.UpdatedAt)
            .IsRequired();
        
        // Composite index for efficient user posts queries (most recent first)
        builder.HasIndex(p => new { p.UserId, p.CreatedAt })
            .IsDescending(false, true)
            .HasDatabaseName("IX_UserPosts_UserId_CreatedAt");
        
        // Index for filtering by type
        builder.HasIndex(p => p.Type)
            .HasDatabaseName("IX_UserPosts_Type");
        
        // Index for feed queries (public, not deleted, ordered by date)
        builder.HasIndex(p => new { p.IsDeleted, p.Visibility, p.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("IX_UserPosts_Feed");
        
        // Index for counting reposts
        builder.HasIndex(p => p.OriginalPostId)
            .HasDatabaseName("IX_UserPosts_OriginalPostId");
        
        builder.ToTable("UserPosts");
    }
}
