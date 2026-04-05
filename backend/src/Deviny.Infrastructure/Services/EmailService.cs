using Deviny.Application.Common.Interfaces;
using Deviny.Application.Common.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Deviny.Infrastructure.Services;

/// <summary>
/// Email service implementation using MailKit for SMTP.
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendOtpEmailAsync(string email, string otpCode, int expirationMinutes)
    {
        var subject = "Код подтверждения Deviny";
        var body = $@"
<!DOCTYPE html>
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
        <div class='logo'>
            <h1>🏋️ Deviny</h1>
        </div>
        <h2 class='title'>Подтверждение email</h2>
        <p class='text'>Используйте код ниже для подтверждения вашего email адреса. Не сообщайте этот код никому.</p>
        <div class='otp-box'>
            <p class='otp-code'>{otpCode}</p>
        </div>
        <p class='expiry'>Код действителен {expirationMinutes} минут</p>
        <div class='footer'>
            <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
            <p>© {DateTime.UtcNow.Year} Deviny. Все права защищены.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body, isHtml: true);
    }

    public async Task SendPasswordResetOtpEmailAsync(string email, string otpCode, int expirationMinutes)
    {
        var subject = "Сброс пароля Deviny";
        var body = $@"
<!DOCTYPE html>
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
        <div class='logo'>
            <h1>🏋️ Deviny</h1>
        </div>
        <h2 class='title'>Сброс пароля</h2>
        <p class='text'>Вы запросили сброс пароля для вашего аккаунта. Используйте код ниже для подтверждения.</p>
        <div class='otp-box'>
            <p class='otp-code'>{otpCode}</p>
        </div>
        <p class='expiry'>Код действителен {expirationMinutes} минут</p>
        <div class='warning'>
            ⚠️ Если вы не запрашивали сброс пароля, проигнорируйте это письмо. Ваш пароль останется без изменений.
        </div>
        <div class='footer'>
            <p>© {DateTime.UtcNow.Year} Deviny. Все права защищены.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body, isHtml: true);
    }

    public async Task SendWelcomeEmailAsync(string email, string firstName)
    {
        var subject = "Добро пожаловать в Deviny! 🎉";
        var body = $@"
<!DOCTYPE html>
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
        .button {{ display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; }}
        .button-container {{ text-align: center; margin: 30px 0; }}
        .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='logo'>
            <h1>🏋️ Deviny</h1>
        </div>
        <h2 class='title'>Добро пожаловать, {firstName}!</h2>
        <p class='text'>Спасибо за регистрацию в Deviny! Мы рады приветствовать вас в нашем сообществе.</p>
        <p class='text'>Начните свой путь к здоровому образу жизни уже сейчас.</p>
        <div class='footer'>
            <p>© {DateTime.UtcNow.Year} Deviny. Все права защищены.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(email, subject, body, isHtml: true);
    }

    private async Task SendEmailAsync(string to, string subject, string body, bool isHtml = false)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
            message.To.Add(new MailboxAddress(to, to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder();
            if (isHtml)
            {
                bodyBuilder.HtmlBody = body;
            }
            else
            {
                bodyBuilder.TextBody = body;
            }
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            // Connect with appropriate security
            var secureSocketOptions = _settings.UseSsl 
                ? SecureSocketOptions.StartTls 
                : SecureSocketOptions.StartTlsWhenAvailable;
            
            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, secureSocketOptions);
            
            // Authenticate
            await client.AuthenticateAsync(_settings.SmtpUsername, _settings.SmtpPassword);
            
            // Send
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email}, subject: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}, subject: {Subject}", to, subject);
            throw;
        }
    }
}
