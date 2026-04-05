using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class EmailOtpConfiguration : IEntityTypeConfiguration<EmailOtp>
{
    public void Configure(EntityTypeBuilder<EmailOtp> builder)
    {
        builder.HasKey(o => o.Id);
        
        builder.Property(o => o.Email)
            .IsRequired()
            .HasMaxLength(256);
        
        builder.Property(o => o.OtpCode)
            .IsRequired()
            .HasMaxLength(6);
        
        builder.Property(o => o.Purpose)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("registration");
        
        builder.HasIndex(o => o.Email);
        
        builder.HasIndex(o => new { o.Email, o.OtpCode, o.Purpose });
    }
}
