using Ignite.Application.Features.Auth.DTOs;

namespace Ignite.API.DTOs;

public class RefreshTokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
}
