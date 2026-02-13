using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class TrainerSpecializationConfiguration : IEntityTypeConfiguration<TrainerSpecialization>
{
    public void Configure(EntityTypeBuilder<TrainerSpecialization> builder)
    {
        builder.HasKey(ts => new { ts.TrainerId, ts.SpecializationId });
        
        builder.HasOne(ts => ts.Trainer)
            .WithMany(tp => tp.Specializations)
            .HasForeignKey(ts => ts.TrainerId);
        
        builder.HasOne(ts => ts.Specialization)
            .WithMany(s => s.TrainerSpecializations)
            .HasForeignKey(ts => ts.SpecializationId);
    }
}
