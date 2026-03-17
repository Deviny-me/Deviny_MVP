using Deviny.Application.Features.Programs.DTOs;
using System.Text.Json;

namespace Deviny.Application.Features.Programs;

public static class ProgramVideoJsonHelper
{
    public static List<ProgramVideoDto> Parse(string? videosJson)
    {
        if (string.IsNullOrWhiteSpace(videosJson))
            return new List<ProgramVideoDto>();

        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var structured = JsonSerializer.Deserialize<List<ProgramVideoDto>>(videosJson, options);
            if (structured != null && structured.Any(v => !string.IsNullOrWhiteSpace(v.VideoUrl)))
            {
                return structured
                    .Where(v => !string.IsNullOrWhiteSpace(v.VideoUrl))
                    .Select(v => new ProgramVideoDto
                    {
                        VideoUrl = v.VideoUrl,
                        Title = v.Title ?? string.Empty,
                        Description = v.Description ?? string.Empty,
                    })
                    .ToList();
            }
        }
        catch
        {
            // Fallback to legacy format below.
        }

        try
        {
            var legacy = JsonSerializer.Deserialize<List<string>>(videosJson);
            return legacy?
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .Select(v => new ProgramVideoDto
                {
                    VideoUrl = v,
                    Title = string.Empty,
                    Description = string.Empty,
                })
                .ToList() ?? new List<ProgramVideoDto>();
        }
        catch
        {
            return new List<ProgramVideoDto>();
        }
    }

    public static string Serialize(IEnumerable<ProgramVideoDto> videos)
    {
        return JsonSerializer.Serialize(videos.Select(v => new ProgramVideoDto
        {
            VideoUrl = v.VideoUrl,
            Title = v.Title ?? string.Empty,
            Description = v.Description ?? string.Empty,
        }));
    }
}
