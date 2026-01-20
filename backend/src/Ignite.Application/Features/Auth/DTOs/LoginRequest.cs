using Ignite.Domain.Enums;

namespace Ignite.Application.Features.Auth.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool RememberMe { get; set; }
}
