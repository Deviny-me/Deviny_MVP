namespace Deviny.Application.DTOs;

public class FriendDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Avatar { get; set; }
    public string? Role { get; set; }
    public DateTime FriendsSince { get; set; }
}
