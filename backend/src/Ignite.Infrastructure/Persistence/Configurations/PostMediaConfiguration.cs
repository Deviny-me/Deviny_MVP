using Ignite.Domain.Entities;
using Ignite.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for PostMedia entity.
/// Defines table structure, relationships, and indexes.
/// </summary>
public class PostMediaConfiguration : IEntityTypeConfiguration<PostMedia>
{
    public void Configure(EntityTypeBuilder<PostMedia> builder)
    {
        builder.HasKey(m => m.Id);
        
        // Post relationship - cascade delete when post is deleted
        builder.HasOne(m => m.Post)
            .WithMany(p => p.Media)
            .HasForeignKey(m => m.PostId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Media type as string
        builder.Property(m => m.MediaType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);
        
        // File path - required, stores relative path
        builder.Property(m => m.FilePath)
            .IsRequired()
            .HasMaxLength(500);
        
        // Thumbnail path - optional, for video previews
        builder.Property(m => m.ThumbnailPath)
            .HasMaxLength(500);
        
        // Content type (MIME type)
        builder.Property(m => m.ContentType)
            .IsRequired()
            .HasMaxLength(100);
        
        // File size in bytes
        builder.Property(m => m.SizeBytes)
            .IsRequired();
        
        // Display order for future carousel support
        builder.Property(m => m.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);
        
        builder.Property(m => m.CreatedAt)
            .IsRequired();
        
        builder.Property(m => m.UpdatedAt)
            .IsRequired();
        
        // Index for efficient media lookup by post
        builder.HasIndex(m => m.PostId)
            .HasDatabaseName("IX_PostMedia_PostId");
        
        builder.ToTable("PostMedia");
    }
}
