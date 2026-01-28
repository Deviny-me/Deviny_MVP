using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Auth.DTOs;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Auth.Commands;

public class LoginCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ILogger<LoginCommandHandler> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<LoginResponse> Handle(LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}, role: {Role}", request.Email, request.Role);
        
        var user = await _userRepository.GetByEmailAsync(request.Email);
        
        if (user == null)
        {
            _logger.LogWarning("User not found: {Email}", request.Email);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        _logger.LogInformation("User found: {Email}, stored role: {Role}", user.Email, user.Role);

        var passwordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        _logger.LogInformation("Password verification result: {Result}", passwordValid);
        
        if (!passwordValid)
        {
            _logger.LogWarning("Invalid password for user: {Email}", request.Email);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        if (user.Role != request.Role)
        {
            throw new InvalidOperationException($"This email is registered as {user.Role.ToString().ToLower()}. Please select the correct role.");
        }

        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email, user.Role.ToString());
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(request.RememberMe ? 30 : 7),
            IsRememberMe = request.RememberMe,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddRefreshTokenAsync(refreshTokenEntity);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                Role = user.Role,
                Country = user.Country,
                City = user.City
            }
        };
    }
}
