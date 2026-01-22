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

        builder.Property(pr => pr.Comment)
            .HasMaxLength(1000);

        builder.HasOne(pr => pr.Program)
            .WithMany(p => p.Reviews)
            .HasForeignKey(pr => pr.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pr => pr.User)
            .WithMany()
            .HasForeignKey(pr => pr.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
