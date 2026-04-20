namespace Deviny.Application.Common.Settings;

/// <summary>
/// Configuration settings for email service (Brevo transactional email API).
/// Follows IOptions pattern for strongly-typed configuration.
///
/// In appsettings.json:
/// {
///   "Email": {
///     "BrevoApiKey": "your-brevo-api-key",
///     "FromEmail": "noreply@deviny.me",
///     "FromName": "Deviny",
///     "OtpExpirationMinutes": 10,
///     "MaxOtpAttempts": 5
///   }
/// }
/// </summary>
public class EmailSettings
{
    public const string SectionName = "Email";

    /// <summary>
    /// Brevo (Sendinblue) API key for sending transactional emails.
    /// </summary>
    public string BrevoApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Email address to send from (must be a verified sender in Brevo).
    /// </summary>
    public string FromEmail { get; set; } = "noreply@deviny.me";

    /// <summary>
    /// Display name for the sender.
    /// </summary>
    public string FromName { get; set; } = "Deviny";

    /// <summary>
    /// How long OTP codes remain valid (in minutes).
    /// </summary>
    public int OtpExpirationMinutes { get; set; } = 10;

    /// <summary>
    /// Maximum number of OTP verification attempts allowed.
    /// </summary>
    public int MaxOtpAttempts { get; set; } = 5;
}
