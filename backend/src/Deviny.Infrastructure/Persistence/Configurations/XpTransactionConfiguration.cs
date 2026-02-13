using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class XpTransactionConfiguration : IEntityTypeConfiguration<XpTransaction>
{
    public void Configure(EntityTypeBuilder<XpTransaction> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.EventType)
            .IsRequired();

        builder.Property(e => e.XpAmount)
            .IsRequired();

        builder.Property(e => e.IdempotencyKey)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint for idempotency
        builder.HasIndex(e => e.IdempotencyKey)
            .IsUnique();

        // Index for querying user's XP history
        builder.HasIndex(e => new { e.UserId, e.CreatedAt });

        // Index for analytics by event type
        builder.HasIndex(e => e.EventType);
    }
}
