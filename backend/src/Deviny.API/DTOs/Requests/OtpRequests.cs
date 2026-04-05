using System.ComponentModel.DataAnnotations;

namespace Deviny.API.DTOs.Requests;

/// <summary>
/// Request to send an OTP to an email address for verification.
/// </summary>
public class SendOtpRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Request to verify an OTP code.
/// </summary>
public class VerifyOtpRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string OtpCode { get; set; } = string.Empty;
}

/// <summary>
/// Request to initiate password reset (forgot password).
/// </summary>
public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Request to reset password with OTP verification.
/// </summary>
public class ResetPasswordRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string OtpCode { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}
