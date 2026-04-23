namespace Deviny.Application.Common.Interfaces;

/// <summary>
/// Service for sending emails.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends an OTP verification email for registration.
    /// </summary>
    /// <param name="email">Recipient email address</param>
    /// <param name="otpCode">The 6-digit OTP code</param>
    /// <param name="expirationMinutes">How long the OTP is valid</param>
    Task SendOtpEmailAsync(string email, string otpCode, int expirationMinutes, string? language = null);
    
    /// <summary>
    /// Sends an OTP email for password reset.
    /// </summary>
    /// <param name="email">Recipient email address</param>
    /// <param name="otpCode">The 6-digit OTP code</param>
    /// <param name="expirationMinutes">How long the OTP is valid</param>
    Task SendPasswordResetOtpEmailAsync(string email, string otpCode, int expirationMinutes, string? language = null);
    
    /// <summary>
    /// Sends a welcome email after successful registration.
    /// </summary>
    /// <param name="email">Recipient email address</param>
    /// <param name="firstName">User's first name</param>
    Task SendWelcomeEmailAsync(string email, string firstName);
}
