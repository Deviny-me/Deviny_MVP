using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class VerificationDocumentConfiguration : IEntityTypeConfiguration<VerificationDocument>
{
    public void Configure(EntityTypeBuilder<VerificationDocument> builder)
    {
        builder.ToTable("VerificationDocuments");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(v => v.FilePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(v => v.FileType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(v => v.FileSize)
            .IsRequired();

        builder.Property(v => v.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(v => v.RejectionReason)
            .HasMaxLength(1000);

        builder.HasOne(v => v.User)
            .WithMany(u => u.VerificationDocuments)
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => v.UserId);
        builder.HasIndex(v => v.Status);
    }
}
