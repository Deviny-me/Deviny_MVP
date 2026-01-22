using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class ProgramPurchaseConfiguration : IEntityTypeConfiguration<ProgramPurchase>
{
    public void Configure(EntityTypeBuilder<ProgramPurchase> builder)
    {
        builder.HasKey(pp => pp.Id);

        builder.HasIndex(pp => pp.ProgramId);
        builder.HasIndex(pp => pp.UserId);

        builder.Property(pp => pp.Status)
            .HasConversion<string>();

        builder.HasOne(pp => pp.Program)
            .WithMany(p => p.Purchases)
            .HasForeignKey(pp => pp.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pp => pp.User)
            .WithMany()
            .HasForeignKey(pp => pp.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
