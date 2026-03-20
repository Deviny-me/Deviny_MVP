namespace Deviny.API.DTOs.Requests;

/// <summary>Body for the REST send-message endpoint.</summary>
public class SendMessageBodyDto
{
    public string Text { get; set; } = string.Empty;
    public Guid? ReplyToMessageId { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? AttachmentContentType { get; set; }
    public long? AttachmentSize { get; set; }
}

