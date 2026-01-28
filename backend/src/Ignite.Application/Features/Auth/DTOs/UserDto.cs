using Ignite.Domain.Enums;

namespace Ignite.Application.Features.Auth.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
}
