using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        
        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);
        
        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(u => u.PasswordHash)
            .IsRequired();
        
        builder.Property(u => u.AvatarUrl)
            .HasMaxLength(500);
        
        builder.Property(u => u.Slug)
            .HasMaxLength(100);
        
        builder.Property(u => u.Gender)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        builder.Property(u => u.Country)
            .HasMaxLength(100);
        
        builder.Property(u => u.City)
            .HasMaxLength(100);
        
        // Ignore computed property
        builder.Ignore(u => u.FullName);
        
        builder.HasIndex(u => u.Email)
            .IsUnique();
        
        builder.HasIndex(u => u.Slug)
            .IsUnique()
            .HasFilter("[Slug] IS NOT NULL");
    }
}
