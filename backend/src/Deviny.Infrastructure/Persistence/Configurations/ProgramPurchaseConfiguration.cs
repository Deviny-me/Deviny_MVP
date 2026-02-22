using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class ProgramPurchaseConfiguration : IEntityTypeConfiguration<ProgramPurchase>
{
    public void Configure(EntityTypeBuilder<ProgramPurchase> builder)
    {
        builder.HasKey(pp => pp.Id);

        builder.HasIndex(pp => pp.ProgramId);
        builder.HasIndex(pp => pp.UserId);

        // Composite index for user's purchased programs
        builder.HasIndex(pp => new { pp.UserId, pp.PurchasedAt })
            .IsDescending(false, true)
            .HasDatabaseName("IX_ProgramPurchases_UserId_PurchasedAt");

        builder.Property(pp => pp.Status)
            .HasConversion<string>();

        builder.Property(pp => pp.Tier)
            .HasConversion<string>();

        builder.HasOne(pp => pp.Program)
            .WithMany(p => p.Purchases)
            .HasForeignKey(pp => pp.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pp => pp.User)
            .WithMany(u => u.ProgramPurchases)
            .HasForeignKey(pp => pp.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
