using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class ChallengeConfiguration : IEntityTypeConfiguration<Challenge>
{
    public void Configure(EntityTypeBuilder<Challenge> builder)
    {
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.HasIndex(c => c.Code)
            .IsUnique();
        
        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(c => c.Description)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(c => c.Type)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        builder.Property(c => c.TargetRole)
            .HasConversion<string?>()
            .HasMaxLength(20);
        
        builder.HasOne(c => c.Achievement)
            .WithOne(a => a.Challenge)
            .HasForeignKey<Challenge>(c => c.AchievementId)
            .OnDelete(DeleteBehavior.SetNull);
        
        builder.HasIndex(c => c.IsActive);
        builder.HasIndex(c => c.TargetRole);
    }
}
