using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations
{
    public class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
    {
        public void Configure(EntityTypeBuilder<Feedback> builder)
        {
            builder.Property(f => f.StarRating).HasPrecision(2, 1);
            builder.Property(f => f.RatingScore).HasColumnType("bigint");

            builder.HasOne(f => f.User)
                   .WithOne(t => t.Feedback)
                   .HasForeignKey<Feedback>(f => f.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}