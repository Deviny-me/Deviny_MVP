namespace Ignite.API.DTOs;

public class UpdateProfileRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Theme { get; set; }
    public bool? PushNotificationsEnabled { get; set; }
}
