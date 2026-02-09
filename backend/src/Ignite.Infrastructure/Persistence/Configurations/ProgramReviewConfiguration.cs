using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class ProgramReviewConfiguration : IEntityTypeConfiguration<ProgramReview>
{
    public void Configure(EntityTypeBuilder<ProgramReview> builder)
    {
        builder.HasKey(pr => pr.Id);

        builder.HasIndex(pr => new { pr.ProgramId, pr.UserId })
            .IsUnique();

        builder.Property(pr => pr.Rating)
            .IsRequired();

        // Add check constraint for rating range 1-5
        builder.ToTable(t => t.HasCheckConstraint("CK_ProgramReview_Rating", "[Rating] >= 1 AND [Rating] <= 5"));

        builder.Property(pr => pr.Comment)
            .HasMaxLength(1000);

        builder.HasOne(pr => pr.Program)
            .WithMany(p => p.Reviews)
            .HasForeignKey(pr => pr.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pr => pr.User)
            .WithMany(u => u.ProgramReviews)
            .HasForeignKey(pr => pr.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
