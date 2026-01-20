using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class TrainerCertificateConfiguration : IEntityTypeConfiguration<TrainerCertificate>
{
    public void Configure(EntityTypeBuilder<TrainerCertificate> builder)
    {
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(300);
        
        builder.Property(c => c.Issuer)
            .HasMaxLength(200);
        
        builder.Property(c => c.FileUrl)
            .HasMaxLength(500);

        builder.Property(c => c.FileName)
            .HasMaxLength(255);
        
        builder.HasIndex(c => c.TrainerId);
        
        builder.HasOne(c => c.Trainer)
            .WithMany(tp => tp.Certificates)
            .HasForeignKey(c => c.TrainerId);
    }
}
