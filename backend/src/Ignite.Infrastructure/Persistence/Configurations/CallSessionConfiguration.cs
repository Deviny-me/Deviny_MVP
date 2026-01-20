using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class CallSessionConfiguration : IEntityTypeConfiguration<CallSession>
{
    public void Configure(EntityTypeBuilder<CallSession> builder)
    {
        builder.ToTable("CallSessions");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CallUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(c => c.RoomId)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.HasOne(c => c.Event)
            .WithMany(e => e.CallSessions)
            .HasForeignKey(c => c.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Trainer)
            .WithMany()
            .HasForeignKey(c => c.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Student)
            .WithMany()
            .HasForeignKey(c => c.StudentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(c => c.EventId);
        builder.HasIndex(c => new { c.TrainerId, c.Status });
    }
}
