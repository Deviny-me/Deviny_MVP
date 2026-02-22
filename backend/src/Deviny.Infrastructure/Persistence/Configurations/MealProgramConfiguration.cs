using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class MealProgramConfiguration : IEntityTypeConfiguration<MealProgram>
{
    public void Configure(EntityTypeBuilder<MealProgram> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.DetailedDescription)
            .IsRequired(false)
            .HasMaxLength(5000);

        builder.Property(p => p.Price)
            .HasPrecision(18, 2);

        builder.Property(p => p.ProPrice)
            .IsRequired(false)
            .HasPrecision(18, 2);

        builder.Property(p => p.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.Code)
            .IsUnique();

        builder.HasIndex(p => p.TrainerId);

        builder.HasIndex(p => new { p.IsDeleted, p.CreatedAt })
            .IsDescending(false, true)
            .HasDatabaseName("IX_MealPrograms_IsDeleted_CreatedAt");

        builder.Property(p => p.CoverImagePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.VideosPath)
            .HasMaxLength(4000); // JSON array

        builder.HasOne(p => p.Trainer)
            .WithMany()
            .HasForeignKey(p => p.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}
