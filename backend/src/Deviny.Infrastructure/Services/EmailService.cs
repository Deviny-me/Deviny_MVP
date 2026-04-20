using System.Net.Http.Json;
using System.Text.Json;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Common.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Deviny.Infrastructure.Services;

/// <summary>
/// Email service implementation using Brevo (Sendinblue) transactional email API.
/// </summary>
public class EmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(HttpClient httpClient, IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendOtpEmailAsync(string email, string otpCode, int expirationMinutes)
    {
        var subject = "Код подтверждения Deviny";
        var body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
        .container {{ max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
        .logo {{ text-align: center; margin-bottom: 30px; }}
        .logo h1 {{ color: #6366f1; font-size: 28px; margin: 0; }}
        .title {{ color: #1f2937; font-size: 24px; text-align: center; margin-bottom: 16px; }}
        .text {{ color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px; }}
        .otp-box {{ background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px; }}
        .otp-code {{ color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; }}
        .expiry {{ color: #9ca3af; font-size: 14px; text-align: center; }}
        .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='logo'><h1>Deviny</h1></div>
        <h2 class='title'>Подтверждение email</h2>
        <p class='text'>Используйте код ниже для подтверждения вашего email адреса. Не сообщайте этот код никому.</p>
        <div class='otp-box'><p class='otp-code'>{otpCode}</p></div>
        <p class='expiry'>Код действителен {expirationMinutes} минут</p>
        <div class='footer'>
            <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
            <p>© {DateTime.UtcNow.Year} Deviny. Все права защищены.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetOtpEmailAsync(string email, string otpCode, int expirationMinutes)
    {
        var subject = "Сброс пароля Deviny";
        var body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
        .container {{ max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
        .logo {{ text-align: center; margin-bottom: 30px; }}
        .logo h1 {{ color: #6366f1; font-size: 28px; margin: 0; }}
        .title {{ color: #1f2937; font-size: 24px; text-align: center; margin-bottom: 16px; }}
        .text {{ color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px; }}
        .otp-box {{ background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px; }}
        .otp-code {{ color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; }}
        .expiry {{ color: #9ca3af; font-size: 14px; text-align: center; }}
        .warning {{ background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-top: 20px; color: #92400e; font-size: 13px; text-align: center; }}
        .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='logo'><h1>Deviny</h1></div>
        <h2 class='title'>Сброс пароля</h2>
        <p class='text'>Вы запросили сброс пароля для вашего аккаунта. Используйте код ниже для подтверждения.</p>
        <div class='otp-box'><p class='otp-code'>{otpCode}</p></div>
        <p class='expiry'>Код действителен {expirationMinutes} минут</p>
        <div class='warning'>⚠️ Если вы не запрашивали сброс пароля, проигнорируйте это письмо. Ваш пароль останется без изменений.</div>
        <div class='footer'><p>© {DateTime.UtcNow.Year} Deviny. Все права защищены.</p></div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string email, string firstName)
    {
        var subject = "Добро пожаловать в Deviny!";
        var body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
        .container {{ max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
        .logo {{ text-align: center; margin-bottom: 30px; }}
        .logo h1 {{ color: #6366f1; font-size: 28px; margin: 0; }}
        .title {{ color: #1f2937; font-size: 24px; text-align: center; margin-bottom: 16px; }}
        .text {{ color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px; }}
        .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='logo'><h1>Deviny</h1></div>
        <h2 class='title'>Добро пожаловать, {firstName}!</h2>
        <p class='text'>Спасибо за регистрацию в Deviny! Мы рады приветствовать вас в нашем сообществе.</p>
        <p class='text'>Начните свой путь к здоровому образу жизни уже сейчас.</p>
        <div class='footer'><p>© {DateTime.UtcNow.Year} Deviny. Все права защищены.</p></div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body);
    }

    private async Task SendEmailAsync(string to, string subject, string htmlContent)
    {
        var payload = new
        {
            sender = new { name = _settings.FromName, email = _settings.FromEmail },
            to = new[] { new { email = to } },
            subject,
            htmlContent
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "v3/smtp/email");
        request.Headers.Add("api-key", _settings.BrevoApiKey);
        request.Content = JsonContent.Create(payload, options: new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        try
        {
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Brevo API error sending to {Email}: {StatusCode} - {Error}",
                    to, response.StatusCode, error);
                throw new InvalidOperationException($"Brevo API returned {response.StatusCode}: {error}");
            }

            _logger.LogInformation("Email sent via Brevo to {Email}, subject: {Subject}", to, subject);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error sending email via Brevo to {Email}", to);
            throw;
        }
    }
}
