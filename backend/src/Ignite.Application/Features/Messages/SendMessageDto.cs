namespace Ignite.Application.Features.Messages;

/// <summary>
/// Used only by the REST endpoint to initiate a new DM.
/// The Hub uses its own SendMessage(conversationId, text, replyToMessageId?) signature.
/// </summary>
public class SendMessageDto
{
    public Guid ReceiverId { get; set; }
    public string Text { get; set; } = string.Empty;
}
