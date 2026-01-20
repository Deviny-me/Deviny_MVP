using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class TrainerAchievementConfiguration : IEntityTypeConfiguration<TrainerAchievement>
{
    public void Configure(EntityTypeBuilder<TrainerAchievement> builder)
    {
        builder.HasKey(a => a.Id);
        
        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(a => a.Subtitle)
            .HasMaxLength(300);
        
        builder.Property(a => a.IconKey)
            .IsRequired()
            .HasMaxLength(50);
        
        builder.Property(a => a.Tone)
            .IsRequired()
            .HasMaxLength(50);
        
        builder.HasIndex(a => a.TrainerId);
        
        builder.HasOne(a => a.Trainer)
            .WithMany(tp => tp.Achievements)
            .HasForeignKey(a => a.TrainerId);
    }
}
