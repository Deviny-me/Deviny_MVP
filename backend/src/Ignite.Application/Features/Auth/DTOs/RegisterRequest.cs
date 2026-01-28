using Ignite.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace Ignite.Application.Features.Auth.DTOs;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    
    // Extended fields for trainer registration
    public string? Gender { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public IFormFile? VerificationDocument { get; set; }
}
