namespace Deviny.Application.Features.Messages;

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderAvatarUrl { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? AttachmentContentType { get; set; }
    public long? AttachmentSize { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }

    /// <summary>Quoted / reply-to message (null if none)</summary>
    public ReplyDto? ReplyTo { get; set; }
}

public class ReplyDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
}
