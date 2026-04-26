using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;
using Deviny.API.Services;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Common.Settings;
using Deviny.Application.Features.Auth.Commands;
using Deviny.Application.Features.Auth.DTOs;
using Deviny.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace Deviny.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly LoginCommandHandler _loginHandler;
    private readonly IUserRepository _userRepository;
    private readonly IMediator _mediator;
    private readonly ITokenService _tokenService;
    private readonly IOtpRepository _otpRepository;
    private readonly IEmailService _emailService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly EmailSettings _emailSettings;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AuthController> _logger;
    private readonly IPresenceService _presenceService;

    public AuthController(
        LoginCommandHandler loginHandler,
        IUserRepository userRepository,
        IMediator mediator,
        ITokenService tokenService,
        IOtpRepository otpRepository,
        IEmailService emailService,
        IPasswordHasher passwordHasher,
        IOptions<EmailSettings> emailSettings,
        IWebHostEnvironment env,
        ILogger<AuthController> logger,
        IPresenceService presenceService)
    {
        _loginHandler = loginHandler;
        _userRepository = userRepository;
        _mediator = mediator;
        _tokenService = tokenService;
        _otpRepository = otpRepository;
        _emailService = emailService;
        _passwordHasher = passwordHasher;
        _emailSettings = emailSettings.Value;
        _env = env;
        _logger = logger;
        _presenceService = presenceService;
    }

    private CookieOptions CreateRefreshCookieOptions()
    {
        var isProduction = !_env.IsDevelopment();
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = isProduction ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        };
    }

    private string GetRequestLanguage()
    {
        var header = Request.Headers.AcceptLanguage.ToString();
        if (string.IsNullOrWhiteSpace(header)) return "ru";

        var primary = header.Split(',')[0].Trim().ToLowerInvariant();
        if (primary.StartsWith("en")) return "en";
        if (primary.StartsWith("az")) return "az";
        return "ru";
    }

    /// <summary>
    /// Sends an OTP code to the specified email address for verification.
    /// </summary>
    [HttpPost("send-otp")]
    public async Task<ActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        try
        {
            // Check if email is already registered
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return Conflict(new { message = "EMAIL_ALREADY_REGISTERED" });
            }

            // Invalidate any existing OTPs for this email
            await _otpRepository.InvalidateAllForEmailAsync(request.Email);

            // Generate 6-digit OTP
            var random = new Random();
            var otpCode = random.Next(100000, 999999).ToString();

            // Create OTP record
            var otp = new EmailOtp
            {
                Id = Guid.NewGuid(),
                Email = request.Email.ToLower(),
                OtpCode = otpCode,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_emailSettings.OtpExpirationMinutes),
                IsUsed = false,
                Attempts = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _otpRepository.CreateAsync(otp);

            // Send email. In development, allow local flow to continue if SMTP is unavailable.
            try
            {
                await _emailService.SendOtpEmailAsync(request.Email, otpCode, _emailSettings.OtpExpirationMinutes, GetRequestLanguage());
            }
            catch (Exception ex) when (_env.IsDevelopment())
            {
                _logger.LogWarning(ex, "SMTP send failed in development for {Email}. Returning OTP for local testing.", request.Email);
                return Ok(new
                {
                    message = "OTP_SENT_DEVELOPMENT",
                    expiresInMinutes = _emailSettings.OtpExpirationMinutes,
                    debugOtp = otpCode
                });
            }

            return Ok(new { message = "OTP_SENT", expiresInMinutes = _emailSettings.OtpExpirationMinutes });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send registration OTP to {Email}", request.Email);
            return StatusCode(500, new { message = "FAILED_TO_SEND_OTP", error = ex.Message });
        }
    }

    /// <summary>
    /// Verifies an OTP code for the specified email address.
    /// </summary>
    [HttpPost("verify-otp")]
    public async Task<ActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        try
        {
            var otp = await _otpRepository.GetByEmailAndCodeAsync(request.Email, request.OtpCode);

            if (otp == null)
            {
                return BadRequest(new { message = "INVALID_OTP" });
            }

            if (otp.IsUsed)
            {
                return BadRequest(new { message = "OTP_ALREADY_USED" });
            }

            if (otp.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { message = "OTP_EXPIRED" });
            }

            if (otp.Attempts >= _emailSettings.MaxOtpAttempts)
            {
                return BadRequest(new { message = "TOO_MANY_ATTEMPTS" });
            }

            // Check if code matches
            if (otp.OtpCode != request.OtpCode)
            {
                await _otpRepository.IncrementAttemptsAsync(otp.Id);
                return BadRequest(new { message = "INVALID_OTP" });
            }

            // Mark as used
            await _otpRepository.MarkAsUsedAsync(otp.Id);

            return Ok(new { message = "EMAIL_VERIFIED", verified = true });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "VERIFICATION_FAILED" });
        }
    }

    /// <summary>
    /// Initiates password reset by sending OTP to the user's email.
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            // Check if user exists
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                return NotFound(new { message = "ACCOUNT_NOT_FOUND" });
            }

            // Invalidate any existing password reset OTPs for this email
            await _otpRepository.InvalidateAllForEmailAsync(request.Email, "password_reset");

            // Generate 6-digit OTP
            var random = new Random();
            var otpCode = random.Next(100000, 999999).ToString();

            // Create OTP record
            var otp = new EmailOtp
            {
                Id = Guid.NewGuid(),
                Email = request.Email.ToLower(),
                OtpCode = otpCode,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_emailSettings.OtpExpirationMinutes),
                IsUsed = false,
                Attempts = 0,
                Purpose = "password_reset",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _otpRepository.CreateAsync(otp);

            // Send password reset email. In development, allow local flow to continue if SMTP is unavailable.
            try
            {
                await _emailService.SendPasswordResetOtpEmailAsync(request.Email, otpCode, _emailSettings.OtpExpirationMinutes, GetRequestLanguage());
            }
            catch (Exception ex) when (_env.IsDevelopment())
            {
                _logger.LogWarning(ex, "SMTP send failed in development for password reset on {Email}. Returning OTP for local testing.", request.Email);
                return Ok(new
                {
                    message = "OTP_SENT_DEVELOPMENT",
                    expiresInMinutes = _emailSettings.OtpExpirationMinutes,
                    debugOtp = otpCode
                });
            }

            return Ok(new { message = "OTP_SENT", expiresInMinutes = _emailSettings.OtpExpirationMinutes });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset OTP to {Email}", request.Email);
            return StatusCode(500, new { message = "FAILED_TO_SEND_OTP", error = ex.Message });
        }
    }

    /// <summary>
    /// Verifies the password reset OTP.
    /// </summary>
    [HttpPost("verify-reset-otp")]
    public async Task<ActionResult> VerifyResetOtp([FromBody] VerifyOtpRequest request)
    {
        try
        {
            var otp = await _otpRepository.GetByEmailAndCodeAsync(request.Email, request.OtpCode, "password_reset");

            if (otp == null)
            {
                return BadRequest(new { message = "INVALID_OTP" });
            }

            if (otp.IsUsed)
            {
                return BadRequest(new { message = "OTP_ALREADY_USED" });
            }

            if (otp.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { message = "OTP_EXPIRED" });
            }

            if (otp.Attempts >= _emailSettings.MaxOtpAttempts)
            {
                return BadRequest(new { message = "TOO_MANY_ATTEMPTS" });
            }

            // Check if code matches
            if (otp.OtpCode != request.OtpCode)
            {
                await _otpRepository.IncrementAttemptsAsync(otp.Id);
                return BadRequest(new { message = "INVALID_OTP" });
            }

            // Don't mark as used yet - will be marked when password is actually reset
            return Ok(new { message = "OTP_VERIFIED", verified = true });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "VERIFICATION_FAILED" });
        }
    }

    /// <summary>
    /// Resets the user's password after OTP verification.
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            // Verify OTP again
            var otp = await _otpRepository.GetByEmailAndCodeAsync(request.Email, request.OtpCode, "password_reset");

            if (otp == null || otp.IsUsed || otp.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { message = "INVALID_OR_EXPIRED_OTP" });
            }

            // Get user
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest(new { message = "USER_NOT_FOUND" });
            }

            // Hash new password
            var passwordHash = _passwordHasher.HashPassword(request.NewPassword);
            
            // Update user password
            user.PasswordHash = passwordHash;
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            // Mark OTP as used
            await _otpRepository.MarkAsUsedAsync(otp.Id);

            // Revoke all refresh tokens for security
            foreach (var token in user.RefreshTokens.Where(t => t.RevokedAt == null))
            {
                await _userRepository.RevokeRefreshTokenAsync(token.Token);
            }

            return Ok(new { message = "PASSWORD_RESET_SUCCESS" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "PASSWORD_RESET_FAILED" });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _loginHandler.Handle(request);
            
            var cookieOptions = CreateRefreshCookieOptions();

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
            _logger.LogError(ex, "Login failed for email: {Email}", request.Email);
            return StatusCode(500, new { message = "An internal error occurred. Please try again later." });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromForm] RegisterRequest request)
    {
        try
        {
            // In local development, allow registering without completing OTP verification.
            if (!_env.IsDevelopment())
            {
                var isEmailVerified = await _otpRepository.IsEmailVerifiedAsync(request.Email);
                if (!isEmailVerified)
                {
                    return BadRequest(new { message = "EMAIL_NOT_VERIFIED" });
                }
            }

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

            if (request.HasInjuries)
            {
                if (request.InjuryDocument == null)
                {
                    return BadRequest(new { message = "Please upload your medical certificate to proceed" });
                }

                if (request.InjuryDocument.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new { message = "File size must be less than 10 MB" });
                }

                var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
                var extension = Path.GetExtension(request.InjuryDocument.FileName).ToLowerInvariant();
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
                request.VerificationDocument,
                request.HasInjuries,
                request.InjuryDocument
            );

            var response = await _mediator.Send(command);
            
            var registerCookieOptions = CreateRefreshCookieOptions();
            registerCookieOptions.Expires = DateTimeOffset.UtcNow.AddDays(7);
            Response.Cookies.Append("refreshToken", response.RefreshToken, registerCookieOptions);

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
            var refreshCookieOptions = CreateRefreshCookieOptions();

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

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            await _presenceService.MarkOfflineAsync(userId);
        }
        
        Response.Cookies.Delete("refreshToken");
        
        return Ok(new { message = "Logged out successfully" });
    }
}


