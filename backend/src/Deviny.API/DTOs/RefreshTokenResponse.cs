using Deviny.Application.Features.Auth.DTOs;

namespace Deviny.API.DTOs;

public class RefreshTokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
}
