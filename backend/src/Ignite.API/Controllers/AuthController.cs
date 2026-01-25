using Ignite.API.DTOs;
using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Auth.Commands;
using Ignite.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Ignite.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly LoginCommandHandler _loginHandler;
    private readonly IUserRepository _userRepository;
    private readonly IMediator _mediator;
    private readonly ITokenService _tokenService;

    public AuthController(
        LoginCommandHandler loginHandler,
        IUserRepository userRepository,
        IMediator mediator,
        ITokenService tokenService)
    {
        _loginHandler = loginHandler;
        _userRepository = userRepository;
        _mediator = mediator;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _loginHandler.Handle(request);
            
            Response.Cookies.Append("refreshToken", response.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Always use HTTPS in production
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(request.RememberMe ? 30 : 7),
                Path = "/"
            });

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var command = new RegisterCommand(
                request.Name,
                request.Email,
                request.Password,
                request.Role
            );

            var response = await _mediator.Send(command);
            
            Response.Cookies.Append("refreshToken", response.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Set to true in production
                SameSite = SameSiteMode.Lax, // For cross-origin in development
                Expires = DateTimeOffset.UtcNow.AddDays(7),
                Path = "/"
            });

            return StatusCode(201, response);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already registered"))
        {
            return Conflict(new { message = "Email уже зарегистрирован" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Ошибка при регистрации" });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshTokenResponse>> RefreshToken()
    {
        try
        {
            // Get refresh token from cookie
            var refreshToken = Request.Cookies["refreshToken"];
            
            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(new { message = "Refresh token not found" });
            }

            // Validate refresh token and get user
            var storedToken = await _userRepository.GetRefreshTokenAsync(refreshToken);
            
            if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
            {
                // Clear invalid cookie
                Response.Cookies.Delete("refreshToken");
                return Unauthorized(new { message = "Refresh token is invalid or expired" });
            }

            var user = storedToken.User;
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Generate new access token
            var newAccessToken = _tokenService.GenerateAccessToken(
                user.Id,
                user.Email,
                user.Role.ToString()
            );

            // Generate new refresh token
            var newRefreshToken = _tokenService.GenerateRefreshToken();
            
            // Revoke old refresh token
            await _userRepository.RevokeRefreshTokenAsync(refreshToken);
            
            // Keep the same "remember me" setting from original token
            var wasRememberMe = storedToken.IsRememberMe;
            var newExpiry = DateTime.UtcNow.AddDays(wasRememberMe ? 30 : 7);
            
            // Save new refresh token
            await _userRepository.AddRefreshTokenAsync(new Domain.Entities.RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = newRefreshToken,
                UserId = user.Id,
                ExpiresAt = newExpiry,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsRememberMe = wasRememberMe
            });

            // Set new refresh token cookie
            Response.Cookies.Append("refreshToken", newRefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Set to true in production
                SameSite = SameSiteMode.Lax, // For cross-origin in development
                Expires = DateTimeOffset.UtcNow.AddDays(wasRememberMe ? 30 : 7),
                Path = "/"
            });

            return Ok(new RefreshTokenResponse
            {
                AccessToken = newAccessToken,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role
                }
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Error refreshing token" });
        }
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _userRepository.RevokeRefreshTokenAsync(refreshToken);
        }
        
        Response.Cookies.Delete("refreshToken");
        
        return Ok(new { message = "Logged out successfully" });
    }
}
