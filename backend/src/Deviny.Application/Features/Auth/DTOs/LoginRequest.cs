using Deviny.Domain.Enums;

namespace Deviny.Application.Features.Auth.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool RememberMe { get; set; }
}
