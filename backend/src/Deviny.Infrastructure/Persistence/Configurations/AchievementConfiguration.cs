using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class AchievementConfiguration : IEntityTypeConfiguration<Achievement>
{
    public void Configure(EntityTypeBuilder<Achievement> builder)
    {
        builder.HasKey(a => a.Id);
        
        builder.Property(a => a.Code)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.HasIndex(a => a.Code)
            .IsUnique();
        
        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(a => a.Description)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(a => a.IconKey)
            .IsRequired()
            .HasMaxLength(50);
        
        builder.Property(a => a.ColorKey)
            .IsRequired()
            .HasMaxLength(50);
        
        builder.Property(a => a.Rarity)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        builder.Property(a => a.TargetRole)
            .HasConversion<string?>()
            .HasMaxLength(20);
        
        builder.HasIndex(a => a.TargetRole);
        builder.HasIndex(a => a.IsActive);
    }
}
