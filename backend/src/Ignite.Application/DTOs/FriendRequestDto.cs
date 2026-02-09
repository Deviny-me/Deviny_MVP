using Ignite.Domain.Enums;

namespace Ignite.Application.DTOs;

public class FriendRequestDto
{
    public int Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderEmail { get; set; } = string.Empty;
    public string? SenderFullName { get; set; }
    public string? SenderAvatar { get; set; }
    public Guid ReceiverId { get; set; }
    public string ReceiverEmail { get; set; } = string.Empty;
    public string? ReceiverFullName { get; set; }
    public string? ReceiverAvatar { get; set; }
    public FriendRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}
