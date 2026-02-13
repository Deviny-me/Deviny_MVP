using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class ScheduleEventConfiguration : IEntityTypeConfiguration<ScheduleEvent>
{
    public void Configure(EntityTypeBuilder<ScheduleEvent> builder)
    {
        builder.ToTable("ScheduleEvents");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Location)
            .HasMaxLength(200);

        builder.Property(e => e.Comment)
            .HasMaxLength(1000);

        builder.Property(e => e.Type)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(e => e.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.HasOne(e => e.Trainer)
            .WithMany()
            .HasForeignKey(e => e.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Student)
            .WithMany()
            .HasForeignKey(e => e.StudentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => new { e.TrainerId, e.StartAt });
        builder.HasIndex(e => e.StudentId);
        builder.HasIndex(e => e.IsCancelled);
    }
}
