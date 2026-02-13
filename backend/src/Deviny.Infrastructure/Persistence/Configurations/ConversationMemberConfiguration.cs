using Deviny.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Deviny.Infrastructure.Persistence.Configurations;

public class ConversationMemberConfiguration : IEntityTypeConfiguration<ConversationMember>
{
    public void Configure(EntityTypeBuilder<ConversationMember> builder)
    {
        builder.HasKey(cm => cm.Id);

        builder.Property(cm => cm.ConversationId).IsRequired();
        builder.Property(cm => cm.UserId).IsRequired();
        builder.Property(cm => cm.JoinedAt).IsRequired();

        builder.HasOne(cm => cm.Conversation)
            .WithMany(c => c.Members)
            .HasForeignKey(cm => cm.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cm => cm.User)
            .WithMany(u => u.ConversationMemberships)
            .HasForeignKey(cm => cm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(cm => new { cm.ConversationId, cm.UserId })
            .IsUnique()
            .HasDatabaseName("IX_ConversationMembers_ConversationId_UserId");

        builder.HasIndex(cm => cm.UserId)
            .HasDatabaseName("IX_ConversationMembers_UserId");
    }
}
