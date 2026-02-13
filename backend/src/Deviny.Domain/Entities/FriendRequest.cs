using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class FriendRequest
{
    public int Id { get; set; }
    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public Guid ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;
    public FriendRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}
