using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;
using Deviny.Application.Features.Users.Commands;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Deviny.API.Controllers;

[Route("api/me")]
public class MeSettingsController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly IMediator _mediator;
    private const string ThemeCookieName = "deviny_theme";
    private const string LanguageCookieName = "deviny_language";
    private static readonly string[] ValidThemes = ["light", "dark"];
    private static readonly string[] ValidLanguages = ["ru", "en", "az"];

    public MeSettingsController(ApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    /// <summary>
    /// Удалить аккаунт текущего пользователя. Требует подтверждения паролем.
    /// </summary>
    [HttpDelete("account")]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
    {
        var userId = GetCurrentUserId();

        await _mediator.Send(new DeleteAccountCommand(userId, request.Password));

        // Очистить refresh token cookie
        Response.Cookies.Delete("refreshToken");

        return NoContent();
    }

    /// <summary>
    /// Get current user settings
    /// </summary>
    [HttpGet("settings")]
    public async Task<ActionResult<SettingsResponse>> GetSettings()
    {
        var userId = GetCurrentUserId();

        var settings = await GetOrCreateUserSettings(userId);
        
        // Set/update cookie for SSR
        SetThemeCookie(settings.Theme);
        SetLanguageCookie(settings.Language ?? "ru");

        return Ok(new SettingsResponse(settings.Theme, settings.Language ?? "ru"));
    }

    /// <summary>
    /// Update theme preference
    /// </summary>
    [HttpPut("settings/theme")]
    public async Task<ActionResult<UpdateThemeResponse>> UpdateTheme([FromBody] UpdateThemeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Theme) || !ValidThemes.Contains(request.Theme.ToLower()))
        {
            return BadRequest(new { error = "Invalid theme. Must be 'light' or 'dark'." });
        }

        var userId = GetCurrentUserId();

        var theme = request.Theme.ToLower();
        var settings = await GetOrCreateUserSettings(userId);
        
        settings.Theme = theme;
        settings.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        // Set cookie for SSR
        SetThemeCookie(theme);

        return Ok(new UpdateThemeResponse(theme));
    }

    /// <summary>
    /// Update language preference
    /// </summary>
    [HttpPut("settings/language")]
    public async Task<ActionResult<UpdateLanguageResponse>> UpdateLanguage([FromBody] UpdateLanguageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Language) || !ValidLanguages.Contains(request.Language.ToLower()))
        {
            return BadRequest(new { error = "Invalid language. Must be 'ru' or 'en'." });
        }

        var userId = GetCurrentUserId();

        var language = request.Language.ToLower();
        var settings = await GetOrCreateUserSettings(userId);
        
        settings.Language = language;
        settings.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        // Set cookie for SSR
        SetLanguageCookie(language);

        return Ok(new UpdateLanguageResponse(language));
    }

    [HttpGet("settings/notifications")]
    public async Task<ActionResult<NotificationSettingsResponse>> GetNotificationSettings()
    {
        var userId = GetCurrentUserId();
        var settings = await GetOrCreateUserSettings(userId);

        return Ok(new NotificationSettingsResponse(
            settings.NotificationsEnabled,
            settings.WorkoutRemindersEnabled,
            settings.AchievementFeedEnabled,
            settings.ContentUpdatesEnabled,
            settings.MessagingEnabled));
    }

    [HttpPut("settings/notifications")]
    public async Task<ActionResult<NotificationSettingsResponse>> UpdateNotificationSettings([FromBody] UpdateNotificationSettingsRequest request)
    {
        var userId = GetCurrentUserId();
        var settings = await GetOrCreateUserSettings(userId);

        if (request.NotificationsEnabled.HasValue)
        {
            settings.NotificationsEnabled = request.NotificationsEnabled.Value;
        }

        if (request.WorkoutRemindersEnabled.HasValue)
        {
            settings.WorkoutRemindersEnabled = request.WorkoutRemindersEnabled.Value;
        }

        if (request.AchievementFeedEnabled.HasValue)
        {
            settings.AchievementFeedEnabled = request.AchievementFeedEnabled.Value;
        }

        if (request.ContentUpdatesEnabled.HasValue)
        {
            settings.ContentUpdatesEnabled = request.ContentUpdatesEnabled.Value;
        }

        if (request.MessagingEnabled.HasValue)
        {
            settings.MessagingEnabled = request.MessagingEnabled.Value;
        }

        settings.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new NotificationSettingsResponse(
            settings.NotificationsEnabled,
            settings.WorkoutRemindersEnabled,
            settings.AchievementFeedEnabled,
            settings.ContentUpdatesEnabled,
            settings.MessagingEnabled));
    }

    private async Task<UserSettings> GetOrCreateUserSettings(Guid userId)
    {
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserSettings
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Theme = "light",
                Language = null,
                NotificationsEnabled = true,
                WorkoutRemindersEnabled = true,
                AchievementFeedEnabled = true,
                ContentUpdatesEnabled = true,
                MessagingEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return settings;
    }

    private void SetThemeCookie(string theme)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = false,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(180)
        };

        Response.Cookies.Append(ThemeCookieName, theme, cookieOptions);
    }

    private void SetLanguageCookie(string language)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = false,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(180)
        };

        Response.Cookies.Append(LanguageCookieName, language, cookieOptions);
    }
}


