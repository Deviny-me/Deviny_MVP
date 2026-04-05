using Deviny.Application.Common;
using Deviny.Application.Features.Messages;
using Deviny.Application.Features.Messages.Commands;
using Deviny.Application.Features.Messages.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Deviny.API.Hubs;
using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;

namespace Deviny.API.Controllers;

/// <summary>
/// REST endpoints for direct messages.
/// Route: /api/me/chats
/// Thin layer – all logic lives in MediatR handlers.
/// </summary>
[Route("api/me/chats")]
public class MeMessagesController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IHubContext<ChatHub> _hubContext;

    public MeMessagesController(IMediator mediator, IHubContext<ChatHub> hubContext)
    {
        _mediator = mediator;
        _hubContext = hubContext;
    }

    /// <summary>Get all my conversations (ordered by latest message, paginated).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<ConversationListItemDto>>> GetMyConversations(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 100) pageSize = 100;

        var result = await _mediator.Send(new GetMyConversationsQuery(GetCurrentUserId(), page, pageSize));
        return Ok(result);
    }

    /// <summary>Get or create a direct conversation with another user.</summary>
    [HttpPost("direct/{otherUserId}")]
    public async Task<ActionResult<object>> GetOrCreateConversation(Guid otherUserId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == otherUserId)
        {
            return BadRequest(CreateProblemDetails(
                "SelfMessage",
                "Cannot start a conversation with yourself.",
                StatusCodes.Status400BadRequest));
        }

        var conversationId = await _mediator.Send(
            new GetOrCreateConversationQuery(currentUserId, otherUserId));
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

    /// <summary>Send a message via REST (alternative to SignalR). Also broadcasts via SignalR for real-time delivery.</summary>
    [HttpPost("{conversationId}/messages")]
    public async Task<ActionResult<MessageDto>> SendMessage(
        Guid conversationId,
        [FromBody] SendMessageBodyDto body)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _mediator.Send(
            new SendMessageCommand(currentUserId, conversationId, body.Text, body.ReplyToMessageId,
                body.AttachmentUrl, body.AttachmentFileName, body.AttachmentContentType, body.AttachmentSize));

        // Broadcast via SignalR so the other user gets real-time notification
        try
        {
            // Push to conversation group (anyone with that conv open)
            await _hubContext.Clients.Group($"conv:{conversationId}").SendAsync("ReceiveMessage", result);

            // Push ConversationUpdated to each member's personal group
            var members = await _mediator.Send(new GetConversationMembersQuery(conversationId));
            foreach (var memberId in members)
            {
                var memberGroup = $"user:{memberId.ToString().ToLowerInvariant()}";
                await _hubContext.Clients.Group(memberGroup).SendAsync("ConversationUpdated", new
                {
                    conversationId,
                    lastMessageText = result.Text,
                    lastMessageAt = result.CreatedAt,
                    senderId = currentUserId,
                    senderName = result.SenderName,
                    senderAvatarUrl = result.SenderAvatarUrl,
                    messageId = result.Id
                });
            }

            // Update unread count for receiver(s)
            var receiverId = members.FirstOrDefault(m => m != currentUserId);
            if (receiverId != Guid.Empty)
            {
                var unreadCount = await _mediator.Send(new GetUnreadMessagesCountQuery(receiverId));
                var receiverGroup = $"user:{receiverId.ToString().ToLowerInvariant()}";
                await _hubContext.Clients.Group(receiverGroup).SendAsync("UnreadCountUpdated", new { totalUnreadCount = unreadCount });
            }
        }
        catch (Exception ex)
        {
            // Log but don't fail the request — message was already saved
            var logger = HttpContext.RequestServices.GetService<ILogger<MeMessagesController>>();
            logger?.LogWarning(ex, "Failed to broadcast message via SignalR for conv {ConvId}", conversationId);
        }

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

#if DEBUG
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
#endif
}


