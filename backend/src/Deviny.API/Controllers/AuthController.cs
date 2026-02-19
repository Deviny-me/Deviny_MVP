using Deviny.API.DTOs;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Auth.Commands;
using Deviny.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Deviny.API.Controllers;

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
            
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // HTTP in development
                SameSite = SameSiteMode.Lax, // Same-site via Next.js proxy
                Path = "/"
            };

            // Remember me: persistent cookie (30 days). Otherwise: session cookie (deleted on browser close).
            if (request.RememberMe)
            {
                cookieOptions.Expires = DateTimeOffset.UtcNow.AddDays(30);
            }

            Response.Cookies.Append("refreshToken", response.RefreshToken, cookieOptions);

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
    public async Task<ActionResult<LoginResponse>> Register([FromForm] RegisterRequest request)
    {
        try
        {
            // Validate file for trainers and nutritionists
            if (request.Role == Domain.Enums.UserRole.Trainer || request.Role == Domain.Enums.UserRole.Nutritionist)
            {
                if (request.VerificationDocument == null)
                {
                    return BadRequest(new { message = "Verification document is required for trainers" });
                }

                // Validate file size (10 MB max)
                if (request.VerificationDocument.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new { message = "File size must be less than 10 MB" });
                }

                // Validate file type
                var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
                var extension = Path.GetExtension(request.VerificationDocument.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new { message = "Only PDF, JPG, and PNG files are allowed" });
                }
            }

            // Parse Gender if provided
            Domain.Enums.Gender? gender = null;
            if (!string.IsNullOrEmpty(request.Gender) && 
                Enum.TryParse<Domain.Enums.Gender>(request.Gender, true, out var parsedGender))
            {
                gender = parsedGender;
            }

            var command = new RegisterCommand(
                request.FirstName,
                request.LastName,
                request.Email,
                request.Password,
                request.Role,
                request.Phone,
                gender,
                request.Country,
                request.City,
                request.VerificationDocument
            );

            var response = await _mediator.Send(command);
            
            Response.Cookies.Append("refreshToken", response.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // HTTP in development
                SameSite = SameSiteMode.Lax, // Same-site via Next.js proxy
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
            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // HTTP in development
                SameSite = SameSiteMode.Lax, // Same-site via Next.js proxy
                Path = "/"
            };

            // Preserve original remember-me preference: persistent cookie vs session cookie.
            if (wasRememberMe)
            {
                refreshCookieOptions.Expires = DateTimeOffset.UtcNow.AddDays(30);
            }

            Response.Cookies.Append("refreshToken", newRefreshToken, refreshCookieOptions);

            return Ok(new RefreshTokenResponse
            {
                AccessToken = newAccessToken,
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
