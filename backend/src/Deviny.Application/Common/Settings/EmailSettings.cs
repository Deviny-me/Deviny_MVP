namespace Deviny.Application.Common.Settings;

/// <summary>
/// Configuration settings for email service (SMTP).
/// Follows IOptions pattern for strongly-typed configuration.
/// 
/// In appsettings.json:
/// {
///   "Email": {
///     "SmtpHost": "smtp.example.com",
///     "SmtpPort": 587,
///     "SmtpUsername": "contact@deviny.me",
///     "SmtpPassword": "your-app-password",
///     "FromEmail": "contact@deviny.me",
///     "FromName": "Deviny",
///     "UseSsl": true,
///     "OtpExpirationMinutes": 10
///   }
/// }
/// </summary>
public class EmailSettings
{
    public const string SectionName = "Email";
    
    /// <summary>
    /// SMTP server hostname.
    /// </summary>
    public string SmtpHost { get; set; } = string.Empty;
    
    /// <summary>
    /// SMTP server port. Common values: 587 (TLS), 465 (SSL), 25 (plain).
    /// </summary>
    public int SmtpPort { get; set; } = 587;
    
    /// <summary>
    /// SMTP authentication username (usually the email address).
    /// </summary>
    public string SmtpUsername { get; set; } = string.Empty;
    
    /// <summary>
    /// SMTP authentication password or app-specific password.
    /// </summary>
    public string SmtpPassword { get; set; } = string.Empty;
    
    /// <summary>
    /// Email address to send from.
    /// </summary>
    public string FromEmail { get; set; } = string.Empty;
    
    /// <summary>
    /// Display name for the sender.
    /// </summary>
    public string FromName { get; set; } = "Deviny";
    
    /// <summary>
    /// Whether to use SSL/TLS for SMTP connection.
    /// </summary>
    public bool UseSsl { get; set; } = true;
    
    /// <summary>
    /// How long OTP codes remain valid (in minutes).
    /// </summary>
    public int OtpExpirationMinutes { get; set; } = 10;
    
    /// <summary>
    /// Maximum number of OTP verification attempts allowed.
    /// </summary>
    public int MaxOtpAttempts { get; set; } = 5;
}
