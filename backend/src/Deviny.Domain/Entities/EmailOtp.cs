namespace Deviny.Domain.Entities;

/// <summary>
/// Represents an OTP (One-Time Password) sent to an email for verification.
/// Used during registration and password reset to verify email ownership.
/// </summary>
public class EmailOtp : BaseEntity
{
    /// <summary>
    /// The email address this OTP was sent to.
    /// </summary>
    public required string Email { get; set; }
    
    /// <summary>
    /// The 6-digit OTP code.
    /// </summary>
    public required string OtpCode { get; set; }
    
    /// <summary>
    /// When this OTP expires (typically 10 minutes after creation).
    /// </summary>
    public required DateTime ExpiresAt { get; set; }
    
    /// <summary>
    /// Whether this OTP has been used/verified.
    /// </summary>
    public required bool IsUsed { get; set; }
    
    /// <summary>
    /// Number of verification attempts made with this OTP.
    /// Used to prevent brute force attacks.
    /// </summary>
    public int Attempts { get; set; }
    
    /// <summary>
    /// Purpose of this OTP: "registration" or "password_reset"
    /// </summary>
    public string Purpose { get; set; } = "registration";
}
