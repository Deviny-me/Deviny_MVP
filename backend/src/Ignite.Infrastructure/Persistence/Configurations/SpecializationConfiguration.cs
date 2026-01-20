using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class SpecializationConfiguration : IEntityTypeConfiguration<Specialization>
{
    public void Configure(EntityTypeBuilder<Specialization> builder)
    {
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.HasIndex(s => s.Name)
            .IsUnique();
        
        builder.HasMany(s => s.TrainerSpecializations)
            .WithOne(ts => ts.Specialization)
            .HasForeignKey(ts => ts.SpecializationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
