using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class LevelDefinitionConfiguration : IEntityTypeConfiguration<LevelDefinition>
{
    public void Configure(EntityTypeBuilder<LevelDefinition> builder)
    {
        builder.HasKey(e => e.Level);

        builder.Property(e => e.Level)
            .ValueGeneratedNever();

        builder.Property(e => e.RequiredXp)
            .IsRequired();

        builder.Property(e => e.Title)
            .HasMaxLength(100);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.Property(e => e.UpdatedAt)
            .IsRequired();
    }
}
