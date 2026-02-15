using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class UserChallengeProgressConfiguration : IEntityTypeConfiguration<UserChallengeProgress>
{
    public void Configure(EntityTypeBuilder<UserChallengeProgress> builder)
    {
        builder.HasKey(ucp => ucp.Id);
        
        builder.HasIndex(ucp => new { ucp.UserId, ucp.ChallengeId })
            .IsUnique();
        
        builder.Property(ucp => ucp.Status)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        builder.HasOne(ucp => ucp.User)
            .WithMany(u => u.ChallengeProgress)
            .HasForeignKey(ucp => ucp.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasOne(ucp => ucp.Challenge)
            .WithMany(c => c.UserProgress)
            .HasForeignKey(ucp => ucp.ChallengeId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasIndex(ucp => ucp.UserId);
    }
}
