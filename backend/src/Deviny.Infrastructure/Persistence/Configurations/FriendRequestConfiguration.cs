using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class FriendRequestConfiguration : IEntityTypeConfiguration<FriendRequest>
{
    public void Configure(EntityTypeBuilder<FriendRequest> builder)
    {
        builder.ToTable("FriendRequests");

        builder.HasKey(fr => fr.Id);

        builder.Property(fr => fr.Status)
            .IsRequired();

        builder.Property(fr => fr.CreatedAt)
            .IsRequired();

        builder.HasOne(fr => fr.Sender)
            .WithMany(u => u.SentFriendRequests)
            .HasForeignKey(fr => fr.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(fr => fr.Receiver)
            .WithMany(u => u.ReceivedFriendRequests)
            .HasForeignKey(fr => fr.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for performance
        builder.HasIndex(fr => new { fr.SenderId, fr.ReceiverId, fr.Status })
            .HasDatabaseName("IX_FriendRequests_Sender_Receiver_Status");

        builder.HasIndex(fr => new { fr.ReceiverId, fr.Status })
            .HasDatabaseName("IX_FriendRequests_Receiver_Status");

        builder.HasIndex(fr => fr.CreatedAt)
            .HasDatabaseName("IX_FriendRequests_CreatedAt");
    }
}
