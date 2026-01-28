namespace Ignite.API.DTOs;

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Theme { get; set; }
    public bool? PushNotificationsEnabled { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
}
