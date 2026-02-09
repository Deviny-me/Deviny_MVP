using Ignite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ignite.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.ConversationId).IsRequired();
        builder.Property(m => m.SenderId).IsRequired();
        builder.Property(m => m.Text).IsRequired().HasMaxLength(2000);
        builder.Property(m => m.CreatedAt).IsRequired();
        builder.Property(m => m.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Sender)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.ReplyToMessage)
            .WithMany()
            .HasForeignKey(m => m.ReplyToMessageId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasIndex(m => new { m.ConversationId, m.CreatedAt })
            .IsDescending(false, true)
            .HasDatabaseName("IX_Messages_ConversationId_CreatedAt");

        builder.HasIndex(m => m.SenderId)
            .HasDatabaseName("IX_Messages_SenderId");

        builder.HasIndex(m => m.ReplyToMessageId)
            .HasDatabaseName("IX_Messages_ReplyToMessageId");
    }
}
