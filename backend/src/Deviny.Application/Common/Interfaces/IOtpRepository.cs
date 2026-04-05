using Deviny.Domain.Entities;

namespace Deviny.Application.Common.Interfaces;

/// <summary>
/// Repository for OTP (One-Time Password) operations.
/// </summary>
public interface IOtpRepository
{
    /// <summary>
    /// Creates a new OTP record in the database.
    /// </summary>
    Task<EmailOtp> CreateAsync(EmailOtp otp);
    
    /// <summary>
    /// Gets the most recent valid (not expired, not used) OTP for an email and purpose.
    /// </summary>
    Task<EmailOtp?> GetValidOtpAsync(string email, string purpose = "registration");
    
    /// <summary>
    /// Gets an OTP by email, code, and purpose (for verification).
    /// </summary>
    Task<EmailOtp?> GetByEmailAndCodeAsync(string email, string code, string purpose = "registration");
    
    /// <summary>
    /// Marks an OTP as used.
    /// </summary>
    Task MarkAsUsedAsync(Guid otpId);
    
    /// <summary>
    /// Increments the attempt count for an OTP.
    /// </summary>
    Task IncrementAttemptsAsync(Guid otpId);
    
    /// <summary>
    /// Invalidates all existing OTPs for an email and purpose (before sending a new one).
    /// </summary>
    Task InvalidateAllForEmailAsync(string email, string purpose = "registration");
    
    /// <summary>
    /// Checks if email has been verified (has a used OTP within the last hour).
    /// </summary>
    Task<bool> IsEmailVerifiedAsync(string email, string purpose = "registration");
}
