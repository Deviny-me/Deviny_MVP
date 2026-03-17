using Deviny.Application.Features.Notifications.Commands;
using Deviny.Application.Features.Notifications.Queries;
using Deviny.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

[Route("api/me/notifications")]
public class MeNotificationsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public MeNotificationsController(IMediator mediator, IRealtimeNotifier realtimeNotifier)
    {
        _mediator = mediator;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Get notifications list with cursor-based pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] DateTime? cursor,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();

        var result = await _mediator.Send(new GetMyNotificationsQuery
        {
            UserId = userId,
            Cursor = cursor,
            Limit = limit
        }, ct);

        return Ok(result);
    }

    /// <summary>
    /// Get unread notifications count (for badge).
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var userId = GetCurrentUserId();

        var count = await _mediator.Send(new GetMyUnreadNotificationCountQuery
        {
            UserId = userId
        }, ct);

        return Ok(count);
    }

    /// <summary>
    /// Mark a single notification as read.
    /// </summary>
    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();

        var success = await _mediator.Send(new MarkNotificationReadCommand
        {
            NotificationId = id,
            UserId = userId
        }, ct);

        if (!success)
            return NotFound(CreateProblemDetails("Notification.NotFound",
                "Уведомление не найдено или уже прочитано", 404));

        var unreadCount = await _mediator.Send(new GetMyUnreadNotificationCountQuery
        {
            UserId = userId
        }, ct);

        await _realtimeNotifier.SendUnreadCountAsync(userId, unreadCount, ct);
        await _realtimeNotifier.SendEntityChangedAsync(
            userId,
            "notifications",
            "updated",
            "notification",
            id,
            new { unreadCount },
            ct);

        return Ok();
    }

    /// <summary>
    /// Mark all notifications as read.
    /// </summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var userId = GetCurrentUserId();

        var count = await _mediator.Send(new MarkAllNotificationsReadCommand
        {
            UserId = userId
        }, ct);

        await _realtimeNotifier.SendUnreadCountAsync(userId, 0, ct);
        await _realtimeNotifier.SendEntityChangedAsync(
            userId,
            "notifications",
            "updated",
            "notification",
            null,
            new { markedReadCount = count, unreadCount = 0 },
            ct);

        return Ok(new { count });
    }
}
