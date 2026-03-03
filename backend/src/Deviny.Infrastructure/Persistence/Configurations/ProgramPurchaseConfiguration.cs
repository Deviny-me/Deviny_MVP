using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class ProgramPurchaseConfiguration : IEntityTypeConfiguration<ProgramPurchase>
{
    public void Configure(EntityTypeBuilder<ProgramPurchase> builder)
    {
        builder.HasKey(pp => pp.Id);

        builder.HasIndex(pp => pp.TrainingProgramId);
        builder.HasIndex(pp => pp.MealProgramId);
        builder.HasIndex(pp => pp.UserId);

        // Composite index for user's purchased programs sorted by date
        builder.HasIndex(pp => new { pp.UserId, pp.PurchasedAt })
            .IsDescending(false, true)
            .HasDatabaseName("IX_ProgramPurchases_UserId_PurchasedAt");

        // Unique: user can purchase a specific program only once per tier
        builder.HasIndex(pp => new { pp.UserId, pp.TrainingProgramId, pp.MealProgramId, pp.Tier })
            .IsUnique()
            .HasFilter(null)
            .HasDatabaseName("IX_ProgramPurchases_User_Program_Tier");

        builder.Property(pp => pp.Status)
            .HasConversion<string>();

        builder.Property(pp => pp.Tier)
            .HasConversion<string>();

        builder.Property(pp => pp.ProgramType)
            .HasConversion<string>();

        // FK к TrainingProgram — nullable
        builder.HasOne(pp => pp.TrainingProgram)
            .WithMany(p => p.Purchases)
            .HasForeignKey(pp => pp.TrainingProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        // FK к MealProgram — nullable
        builder.HasOne(pp => pp.MealProgram)
            .WithMany(p => p.Purchases)
            .HasForeignKey(pp => pp.MealProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pp => pp.User)
            .WithMany(u => u.ProgramPurchases)
            .HasForeignKey(pp => pp.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
