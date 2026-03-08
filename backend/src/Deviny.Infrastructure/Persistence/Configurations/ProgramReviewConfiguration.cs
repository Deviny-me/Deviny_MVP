using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class ProgramReviewConfiguration : IEntityTypeConfiguration<ProgramReview>
{
    public void Configure(EntityTypeBuilder<ProgramReview> builder)
    {
        builder.HasKey(pr => pr.Id);

        // One review per user per training program
        builder.HasIndex(pr => new { pr.TrainingProgramId, pr.UserId })
            .IsUnique()
            .HasFilter("\"TrainingProgramId\" IS NOT NULL");

        // One review per user per meal program
        builder.HasIndex(pr => new { pr.MealProgramId, pr.UserId })
            .IsUnique()
            .HasFilter("\"MealProgramId\" IS NOT NULL");

        builder.Property(pr => pr.Rating)
            .IsRequired();

        builder.ToTable(t => t.HasCheckConstraint("CK_ProgramReview_Rating", "\"Rating\" >= 1 AND \"Rating\" <= 5"));

        builder.Property(pr => pr.Comment)
            .HasMaxLength(1000);

        builder.Property(pr => pr.ProgramType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasOne(pr => pr.TrainingProgram)
            .WithMany(p => p.Reviews)
            .HasForeignKey(pr => pr.TrainingProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pr => pr.MealProgram)
            .WithMany(p => p.Reviews)
            .HasForeignKey(pr => pr.MealProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pr => pr.User)
            .WithMany(u => u.ProgramReviews)
            .HasForeignKey(pr => pr.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
