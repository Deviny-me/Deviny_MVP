using Deviny.Application.Features.Messages;
using Deviny.Application.Features.Messages.Commands;
using Deviny.Application.Features.Messages.Queries;
using Deviny.API.Services;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Text.Json;

namespace Deviny.API.Hubs;

/// <summary>
/// SignalR Hub for real-time chat.
/// Uses Groups (user:{id} and conv:{id}) instead of a static Dictionary.
/// All persistence goes through MediatR.
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IMediator _mediator;
    private readonly IPresenceService _presenceService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(
        IMediator mediator,
        IPresenceService presenceService,
        INotificationService notificationService,
        ILogger<ChatHub> logger)
    {
        _mediator = mediator;
        _presenceService = presenceService;
        _notificationService = notificationService;
        _logger = logger;
    }

    // ──────────── lifecycle ────────────

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId != null)
        {
            // Normalize to lowercase for consistent group naming
            var normalizedUserId = userId.ToLowerInvariant();
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{normalizedUserId}");
            _logger.LogInformation("✅ User {UserId} connected ({ConnId}) and added to group 'user:{NormalizedId}'", 
                userId, Context.ConnectionId, normalizedUserId);

            if (Guid.TryParse(userId, out var userGuid))
            {
                var change = await _presenceService.OnConnectedAsync(userGuid, Context.ConnectionId);
                if (change.Changed)
                {
                    await BroadcastPresenceUpdatedAsync(change.State);
                }
            }
        }
        else
        {
            _logger.LogWarning("⚠️ User connected but userId is null ({ConnId})", Context.ConnectionId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId != null)
        {
            var normalizedUserId = userId.ToLowerInvariant();
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{normalizedUserId}");
            _logger.LogInformation("User {UserId} disconnected", userId);

            if (Guid.TryParse(userId, out var userGuid))
            {
                var change = await _presenceService.OnDisconnectedAsync(userGuid, Context.ConnectionId);
                if (change.Changed)
                {
                    await BroadcastPresenceUpdatedAsync(change.State);
                }
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    // ──────────── hub methods ────────────

    /// <summary>Client calls this when opening a conversation thread.</summary>
    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conv:{conversationId}");
    }

    /// <summary>Client calls this when leaving a conversation thread.</summary>
    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conv:{conversationId}");
    }

    public async Task SubscribePresence(string userId)
    {
        if (!Guid.TryParse(userId, out var targetUserId))
        {
            await Clients.Caller.SendAsync("Error", "Invalid user id");
            return;
        }

        var normalized = targetUserId.ToString().ToLowerInvariant();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"presence:{normalized}");

        var state = await _presenceService.GetUserPresenceAsync(targetUserId);
        await Clients.Caller.SendAsync("PresenceUpdated", new
        {
            userId = state.UserId,
            isOnline = state.IsOnline,
            lastSeenAtUtc = state.LastSeenAtUtc
        });
    }

    public async Task UnsubscribePresence(string userId)
    {
        if (!Guid.TryParse(userId, out var targetUserId)) return;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"presence:{targetUserId.ToString().ToLowerInvariant()}");
    }

    public async Task Heartbeat()
    {
        var userId = GetUserId();
        if (userId == null || !Guid.TryParse(userId, out var userGuid)) return;

        var change = await _presenceService.HeartbeatAsync(userGuid, Context.ConnectionId);
        if (change.Changed)
        {
            await BroadcastPresenceUpdatedAsync(change.State);
        }
    }

    /// <summary>
    /// Send a message. receiverId is used only when no conversation exists yet.
    /// </summary>
    public async Task SendMessage(string conversationId, string text, string? replyToMessageId = null, string? attachmentUrl = null, string? attachmentFileName = null, string? attachmentContentType = null, long? attachmentSize = null)
    {
        var senderId = GetUserId();
        if (senderId == null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }

        try
        {
            var senderGuid = Guid.Parse(senderId);
            var convGuid = Guid.Parse(conversationId);
            Guid? replyGuid = string.IsNullOrEmpty(replyToMessageId) ? null : Guid.Parse(replyToMessageId);

            var messageDto = await _mediator.Send(new SendMessageCommand(
                senderGuid, convGuid, text ?? string.Empty, replyGuid,
                attachmentUrl, attachmentFileName, attachmentContentType, attachmentSize));

            // Push to everyone in the conversation group (including sender)
            await Clients.Group($"conv:{conversationId}").SendAsync("ReceiveMessage", messageDto);

            // Push ConversationUpdated to each member's PERSONAL group
            // so their conversation list updates even if they don't have this conv open.
            var members = await _mediator.Send(new GetConversationMembersQuery(convGuid));
            foreach (var memberId in members)
            {
                var memberGroup = $"user:{memberId.ToString().ToLowerInvariant()}";
                await Clients.Group(memberGroup).SendAsync("ConversationUpdated", new
                {
                    conversationId = convGuid,
                    lastMessageText = messageDto.Text,
                    lastMessageAt = messageDto.CreatedAt,
                    senderId = senderGuid,
                    senderName = messageDto.SenderName,
                    senderAvatarUrl = messageDto.SenderAvatarUrl,
                    messageId = messageDto.Id
                });
            }

            // ✅ GLOBAL UNREAD BADGE: Notify receiver about updated unread count
            await UpdateReceiverUnreadCountAsync(convGuid, senderGuid, members);

            _logger.LogInformation("Message {MsgId} sent in conv {ConvId} by {UserId}",
                messageDto.Id, conversationId, senderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message in conv {ConvId}", conversationId);
            await Clients.Caller.SendAsync("Error", "Failed to send message");
        }
    }

    /// <summary>
    /// Create-or-get a direct conversation, then send the first message.
    /// Used when starting a DM from a profile / experts list.
    /// </summary>
    public async Task StartDirectMessage(string receiverId, string text)
    {
        var senderId = GetUserId();
        if (senderId == null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }

        try
        {
            var senderGuid = Guid.Parse(senderId);
            var receiverGuid = Guid.Parse(receiverId);

            // Prevent self-messaging
            if (senderGuid == receiverGuid)
            {
                await Clients.Caller.SendAsync("Error", "Cannot send a message to yourself");
                return;
            }

            // Get or create the conversation
            var conversationId = await _mediator.Send(
                new GetOrCreateConversationQuery(senderGuid, receiverGuid));

            // Join both users to the conversation group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conv:{conversationId}");

            // Send the message
            var messageDto = await _mediator.Send(new SendMessageCommand(
                senderGuid, conversationId, text));

            // Push to conversation group
            await Clients.Group($"conv:{conversationId}").SendAsync("ReceiveMessage", messageDto);

            // Notify receiver's personal group about the new conversation
            await Clients.Group($"user:{receiverId.ToLowerInvariant()}").SendAsync("NewConversation", new
            {
                conversationId,
                messageDto
            });

            // Push ConversationUpdated to each member's personal group
            var members = new List<Guid> { senderGuid, receiverGuid };
            foreach (var memberId in members)
            {
                var memberGroup = $"user:{memberId.ToString().ToLowerInvariant()}";
                await Clients.Group(memberGroup).SendAsync("ConversationUpdated", new
                {
                    conversationId,
                    lastMessageText = messageDto.Text,
                    lastMessageAt = messageDto.CreatedAt,
                    senderId = senderGuid,
                    senderName = messageDto.SenderName,
                    senderAvatarUrl = messageDto.SenderAvatarUrl,
                    messageId = messageDto.Id
                });
            }

            // ✅ GLOBAL UNREAD BADGE: Notify receiver about updated unread count
            await UpdateReceiverUnreadCountAsync(conversationId, senderGuid, members);

            _logger.LogInformation("Direct message from {SenderId} to {ReceiverId}, conv {ConvId}",
                senderId, receiverId, conversationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting DM from {SenderId} to {ReceiverId}", senderId, receiverId);
            await Clients.Caller.SendAsync("Error", "Failed to start conversation");
        }
    }

    /// <summary>Mark all messages as read in this conversation.</summary>
    public async Task MarkRead(string conversationId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        try
        {
            var userGuid = Guid.Parse(userId);
            var convGuid = Guid.Parse(conversationId);

            var readIds = await _mediator.Send(new MarkMessagesAsReadCommand(userGuid, convGuid));

            if (readIds.Count > 0)
            {
                // Notify all members of the conversation (so sender sees read receipt)
                await Clients.Group($"conv:{conversationId}").SendAsync("MessagesRead", new
                {
                    conversationId = convGuid,
                    messageIds = readIds,
                    readBy = userGuid,
                    readAt = DateTime.UtcNow
                });
            }

            // ✅ GLOBAL UNREAD BADGE: User just read messages, update their unread count
            if (readIds.Count > 0 && userId != null)
            {
                await UpdateUserUnreadCountAsync(userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking read for conv {ConvId}", conversationId);
        }
    }

    /// <summary>Typing indicator.</summary>
    public async Task Typing(string conversationId)
    {
        var userId = GetUserId();
        if (userId == null) return;
        await Clients.OthersInGroup($"conv:{conversationId}").SendAsync("UserTyping", new
        {
            conversationId,
            userId
        });
    }

    /// <summary>Stop typing indicator.</summary>
    public async Task StopTyping(string conversationId)
    {
        var userId = GetUserId();
        if (userId == null) return;
        await Clients.OthersInGroup($"conv:{conversationId}").SendAsync("UserStoppedTyping", new
        {
            conversationId,
            userId
        });
    }

    /// <summary>Relays WebRTC offer to the target participant.</summary>
    public async Task SendCallOffer(string conversationId, string targetUserId, string callType, string offerJson)
    {
        var senderId = GetUserId();
        if (senderId == null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }

        if (!Guid.TryParse(senderId, out var senderGuid) ||
            !Guid.TryParse(conversationId, out var conversationGuid) ||
            !Guid.TryParse(targetUserId, out var targetGuid) ||
            senderGuid == targetGuid)
        {
            await Clients.Caller.SendAsync("Error", "Invalid call participants");
            return;
        }

        var normalizedCallType = (callType ?? string.Empty).Trim().ToLowerInvariant();
        if (normalizedCallType is not ("audio" or "video"))
        {
            await Clients.Caller.SendAsync("Error", "Invalid call type");
            _logger.LogWarning("Rejected call offer with invalid type {CallType} in conversation {ConversationId}", callType, conversationId);
            return;
        }

        var offer = DeserializeJsonOrNull(offerJson);
        if (!IsRtcSessionDescription(offer))
        {
            await Clients.Caller.SendAsync("Error", "Invalid call offer");
            _logger.LogWarning("Rejected malformed call offer from {SenderId} to {TargetUserId} in conversation {ConversationId}", senderId, targetUserId, conversationId);
            return;
        }

        if (!await AreUsersInConversation(conversationId, senderId, targetUserId))
        {
            await Clients.Caller.SendAsync("Error", "Invalid call participants");
            return;
        }

        var senderName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "User";
        await CreateIncomingCallNotificationAsync(targetGuid, senderName, normalizedCallType, conversationGuid);

        var targetPresence = await _presenceService.GetUserPresenceAsync(targetGuid);
        if (!targetPresence.IsOnline)
        {
            await Clients.Caller.SendAsync("CallUnavailable", new
            {
                conversationId,
                targetUserId,
                reason = "offline"
            });
            _logger.LogInformation(
                "Call offer from {SenderId} to offline user {TargetUserId} in conversation {ConversationId} was not relayed",
                senderId,
                targetUserId,
                conversationId);
            return;
        }

        var targetGroup = $"user:{targetUserId.ToLowerInvariant()}";

        await Clients.Group(targetGroup).SendAsync("CallOffer", new
        {
            conversationId,
            fromUserId = senderId,
            fromUserName = senderName,
            callType = normalizedCallType,
            offer = offer!.Value
        });

        _logger.LogInformation(
            "Relayed {CallType} call offer from {SenderId} to {TargetUserId} in conversation {ConversationId}",
            normalizedCallType,
            senderId,
            targetUserId,
            conversationId);
    }

    /// <summary>Relays WebRTC answer to the target participant.</summary>
    public async Task SendCallAnswer(string conversationId, string targetUserId, string answerJson)
    {
        var senderId = GetUserId();
        if (senderId == null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }

        if (!await AreUsersInConversation(conversationId, senderId, targetUserId))
        {
            await Clients.Caller.SendAsync("Error", "Invalid call participants");
            return;
        }

        var answer = DeserializeJsonOrNull(answerJson);
        if (!IsRtcSessionDescription(answer))
        {
            await Clients.Caller.SendAsync("Error", "Invalid call answer");
            _logger.LogWarning("Rejected malformed call answer from {SenderId} to {TargetUserId} in conversation {ConversationId}", senderId, targetUserId, conversationId);
            return;
        }

        var targetGroup = $"user:{targetUserId.ToLowerInvariant()}";
        await Clients.Group(targetGroup).SendAsync("CallAnswer", new
        {
            conversationId,
            fromUserId = senderId,
            answer = answer!.Value
        });

        _logger.LogInformation("Relayed call answer from {SenderId} to {TargetUserId} in conversation {ConversationId}", senderId, targetUserId, conversationId);
    }

    /// <summary>Relays ICE candidates between peers.</summary>
    public async Task SendCallIceCandidate(string conversationId, string targetUserId, string candidateJson)
    {
        var senderId = GetUserId();
        if (senderId == null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }

        if (!await AreUsersInConversation(conversationId, senderId, targetUserId))
        {
            await Clients.Caller.SendAsync("Error", "Invalid call participants");
            return;
        }

        var candidate = DeserializeJsonOrNull(candidateJson);
        if (!IsRtcIceCandidate(candidate))
        {
            await Clients.Caller.SendAsync("Error", "Invalid ICE candidate");
            _logger.LogWarning("Rejected malformed ICE candidate from {SenderId} to {TargetUserId} in conversation {ConversationId}", senderId, targetUserId, conversationId);
            return;
        }

        var targetGroup = $"user:{targetUserId.ToLowerInvariant()}";
        await Clients.Group(targetGroup).SendAsync("CallIceCandidate", new
        {
            conversationId,
            fromUserId = senderId,
            candidate = candidate!.Value
        });
    }

    /// <summary>Ends an active or pending call for both peers.</summary>
    public async Task EndCall(string conversationId, string targetUserId, string reason = "ended")
    {
        var senderId = GetUserId();
        if (senderId == null)
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized");
            return;
        }

        if (!await AreUsersInConversation(conversationId, senderId, targetUserId))
        {
            await Clients.Caller.SendAsync("Error", "Invalid call participants");
            return;
        }

        var targetGroup = $"user:{targetUserId.ToLowerInvariant()}";
        await Clients.Group(targetGroup).SendAsync("CallEnded", new
        {
            conversationId,
            fromUserId = senderId,
            reason
        });

        await Clients.Caller.SendAsync("CallEnded", new
        {
            conversationId,
            fromUserId = senderId,
            reason
        });

        _logger.LogInformation(
            "Call ended in conversation {ConversationId} by {SenderId} for {TargetUserId} with reason {Reason}",
            conversationId,
            senderId,
            targetUserId,
            reason);
    }

    // ──────────── helpers ────────────

    private static JsonElement? DeserializeJsonOrNull(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;

        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.Clone();
        }
        catch
        {
            return null;
        }
    }

    private static bool IsRtcSessionDescription(JsonElement? value)
    {
        if (value is null || value.Value.ValueKind != JsonValueKind.Object) return false;

        var element = value.Value;
        return element.TryGetProperty("type", out var type) &&
               type.ValueKind == JsonValueKind.String &&
               element.TryGetProperty("sdp", out var sdp) &&
               sdp.ValueKind == JsonValueKind.String &&
               !string.IsNullOrWhiteSpace(type.GetString()) &&
               !string.IsNullOrWhiteSpace(sdp.GetString());
    }

    private static bool IsRtcIceCandidate(JsonElement? value)
    {
        if (value is null || value.Value.ValueKind != JsonValueKind.Object) return false;

        var element = value.Value;
        return element.TryGetProperty("candidate", out var candidate) &&
               candidate.ValueKind == JsonValueKind.String &&
               !string.IsNullOrWhiteSpace(candidate.GetString());
    }

    private async Task CreateIncomingCallNotificationAsync(
        Guid targetUserId,
        string senderName,
        string callType,
        Guid conversationId)
    {
        try
        {
            await _notificationService.CreateAsync(
                targetUserId,
                NotificationType.IncomingCall,
                "Incoming call",
                $"{senderName} started a {callType} call.",
                "Conversation",
                conversationId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to create incoming call notification for user {TargetUserId} in conversation {ConversationId}",
                targetUserId,
                conversationId);
        }
    }

    private async Task<bool> AreUsersInConversation(string conversationId, string senderId, string targetUserId)
    {
        if (!Guid.TryParse(conversationId, out var convGuid)) return false;
        if (!Guid.TryParse(senderId, out var senderGuid)) return false;
        if (!Guid.TryParse(targetUserId, out var targetGuid)) return false;
        if (senderGuid == targetGuid) return false;

        var members = await _mediator.Send(new GetConversationMembersQuery(convGuid));
        return members.Contains(senderGuid) && members.Contains(targetGuid);
    }

    private string? GetUserId()
    {
        return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value;
    }

    /// <summary>
    /// Notify the receiver (the OTHER user in this conversation) about their updated unread count.
    /// Server-authoritative: always send accurate count from DB.
    /// </summary>
    private async Task UpdateReceiverUnreadCountAsync(Guid conversationId, Guid senderId, List<Guid>? preloadedMembers = null)
    {
        try
        {
            // Find the other member in this conversation (the receiver)
            var members = preloadedMembers ?? await _mediator.Send(new GetConversationMembersQuery(conversationId));
            _logger.LogInformation("🔍 Conversation {ConvId} members: [{Members}], sender: {SenderId}", 
                conversationId, string.Join(", ", members), senderId);

            var receiverId = members.FirstOrDefault(m => m != senderId);

            if (receiverId == Guid.Empty)
            {
                _logger.LogWarning("❌ Could not find receiver in conversation {ConvId}. Members: [{Members}], Sender: {SenderId}", 
                    conversationId, string.Join(", ", members), senderId);
                return;
            }

            _logger.LogInformation("✅ Receiver identified: {ReceiverId}", receiverId);

            // Get authoritative unread count from DB
            var unreadCount = await _mediator.Send(new GetUnreadMessagesCountQuery(receiverId));
            _logger.LogInformation("📊 Unread count for user {UserId}: {Count}", receiverId, unreadCount);

            // Send to receiver's personal group — use same format as OnConnectedAsync (GetUserId() returns lowercase from JWT)
            var receiverGroup = $"user:{receiverId.ToString().ToLowerInvariant()}";
            await Clients.Group(receiverGroup).SendAsync("UnreadCountUpdated", new { totalUnreadCount = unreadCount });

            _logger.LogInformation("📧 Sent UnreadCountUpdated to group '{Group}' with count: {Count}", receiverGroup, unreadCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update receiver unread count for conv {ConvId}", conversationId);
        }
    }

    /// <summary>
    /// Notify user about their own updated unread count (e.g. after marking messages as read).
    /// </summary>
    private async Task UpdateUserUnreadCountAsync(string userId)
    {
        try
        {
            var userGuid = Guid.Parse(userId);
            var unreadCount = await _mediator.Send(new GetUnreadMessagesCountQuery(userGuid));
            var group = $"user:{userId.ToLowerInvariant()}";
            await Clients.Group(group).SendAsync("UnreadCountUpdated", new { totalUnreadCount = unreadCount });
            _logger.LogInformation("✅ Sent UnreadCountUpdated to group '{Group}': {Count}", group, unreadCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update unread count for user {UserId}", userId);
        }
    }

    private Task BroadcastPresenceUpdatedAsync(Deviny.API.Services.Models.PresenceStateDto state)
    {
        return Clients.Group($"presence:{state.UserId.ToString().ToLowerInvariant()}").SendAsync("PresenceUpdated", new
        {
            userId = state.UserId,
            isOnline = state.IsOnline,
            lastSeenAtUtc = state.LastSeenAtUtc
        });
    }
}
