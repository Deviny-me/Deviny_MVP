namespace Ignite.API.DTOs;

public record SettingsResponse(string Theme, string? Language);

public record UpdateThemeRequest(string Theme);

public record UpdateThemeResponse(string Theme);

public record UpdateLanguageRequest(string Language);

public record UpdateLanguageResponse(string Language);
