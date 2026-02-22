namespace Deviny.Application.Features.Messages;

public class ConversationListItemDto
{
    public Guid Id { get; set; }
    public PeerUserDto PeerUser { get; set; } = null!;
    public string? LastMessageText { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
}

public class PeerUserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Role { get; set; }
}
