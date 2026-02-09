using Ignite.Application.Features.Messages;
using Ignite.Application.Features.Messages.Commands;
using Ignite.Application.Features.Messages.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Ignite.API.Hubs;

namespace Ignite.API.Controllers;

/// <summary>
/// REST endpoints for direct messages.
/// Route: /api/me/chats
/// Thin layer – all logic lives in MediatR handlers.
/// </summary>
[Route("api/me/chats")]
public class ChatsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatsController(IMediator mediator, IHubContext<ChatHub> hubContext)
    {
        _mediator = mediator;
        _hubContext = hubContext;
    }

    /// <summary>Get all my conversations (ordered by latest message).</summary>
    [HttpGet]
    public async Task<ActionResult<List<ConversationListItemDto>>> GetMyConversations()
    {
        var result = await _mediator.Send(new GetMyConversationsQuery(GetCurrentUserId()));
        return Ok(result);
    }

    /// <summary>Get or create a direct conversation with another user.</summary>
    [HttpPost("direct/{otherUserId}")]
    public async Task<ActionResult<object>> GetOrCreateConversation(Guid otherUserId)
    {
        var conversationId = await _mediator.Send(
            new GetOrCreateConversationQuery(GetCurrentUserId(), otherUserId));
        return Ok(new { conversationId });
    }

    /// <summary>
    /// Get messages in a conversation (cursor-based pagination).
    /// Pass ?cursor=2025-01-01T00:00:00Z for subsequent pages.
    /// </summary>
    [HttpGet("{conversationId}/messages")]
    public async Task<ActionResult<List<MessageDto>>> GetMessages(
        Guid conversationId,
        [FromQuery] DateTime? cursor = null,
        [FromQuery] int pageSize = 50)
    {
        var result = await _mediator.Send(
            new GetConversationMessagesQuery(GetCurrentUserId(), conversationId, cursor, pageSize));
        return Ok(result);
    }

    /// <summary>Send a message via REST (alternative to SignalR).</summary>
    [HttpPost("{conversationId}/messages")]
    public async Task<ActionResult<MessageDto>> SendMessage(
        Guid conversationId,
        [FromBody] SendMessageBodyDto body)
    {
        var result = await _mediator.Send(
            new SendMessageCommand(GetCurrentUserId(), conversationId, body.Text, body.ReplyToMessageId,
                body.AttachmentUrl, body.AttachmentFileName, body.AttachmentContentType, body.AttachmentSize));
        return Ok(result);
    }

    /// <summary>Mark messages as read.</summary>
    [HttpPost("{conversationId}/read")]
    public async Task<IActionResult> MarkRead(Guid conversationId)
    {
        await _mediator.Send(new MarkMessagesAsReadCommand(GetCurrentUserId(), conversationId));
        return NoContent();
    }

    /// <summary>Get total unread messages count for the current user. Server-authoritative.</summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        var count = await _mediator.Send(new GetUnreadMessagesCountQuery(userId));
        return Ok(new { unreadCount = count });
    }

    /// <summary>TEST ENDPOINT: Manually trigger UnreadCountUpdated event for current user.</summary>
    [HttpPost("test-unread-event")]
    public async Task<ActionResult<object>> TestUnreadEvent()
    {
        var userId = GetCurrentUserId();
        var count = await _mediator.Send(new GetUnreadMessagesCountQuery(userId));
        var group = $"user:{userId.ToString().ToLowerInvariant()}";
        
        await _hubContext.Clients.Group(group).SendAsync("UnreadCountUpdated", new { totalUnreadCount = count });
        
        return Ok(new { message = "Event sent", userId, count, group });
    }
}

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
