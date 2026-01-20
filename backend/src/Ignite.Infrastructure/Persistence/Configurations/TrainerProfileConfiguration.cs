using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class TrainerProfileConfiguration : IEntityTypeConfiguration<TrainerProfile>
{
    public void Configure(EntityTypeBuilder<TrainerProfile> builder)
    {
        builder.HasKey(tp => tp.Id);
        
        builder.Property(tp => tp.Slug)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(tp => tp.PrimaryTitle)
            .HasMaxLength(200);
        
        builder.Property(tp => tp.SecondaryTitle)
            .HasMaxLength(200);
        
        builder.Property(tp => tp.Location)
            .HasMaxLength(200);
        
        builder.Property(tp => tp.AboutText)
            .HasMaxLength(2000);
        
        builder.HasIndex(tp => tp.UserId)
            .IsUnique();
        
        builder.HasIndex(tp => tp.Slug)
            .IsUnique();
        
        // User relationship (one-to-one)
        builder.HasOne(tp => tp.User)
            .WithOne(u => u.TrainerProfile)
            .HasForeignKey<TrainerProfile>(tp => tp.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // GymBro relationship (many-to-one, optional)
        builder.HasOne(tp => tp.GymBro)
            .WithMany()
            .HasForeignKey(tp => tp.GymBroId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);
        
        builder.HasMany(tp => tp.Certificates)
            .WithOne(c => c.Trainer)
            .HasForeignKey(c => c.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(tp => tp.Achievements)
            .WithOne(a => a.Trainer)
            .HasForeignKey(a => a.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(tp => tp.Specializations)
            .WithOne(ts => ts.Trainer)
            .HasForeignKey(ts => ts.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
