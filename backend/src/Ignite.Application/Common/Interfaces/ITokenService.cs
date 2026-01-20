namespace Ignite.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(Guid userId, string email, string role);
    string GenerateRefreshToken();
    Task<string?> ValidateRefreshToken(string token);
}
