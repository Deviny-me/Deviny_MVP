using Microsoft.AspNetCore.Http;

namespace Deviny.Application.Features.Programs.DTOs;

public class UpdateProgramRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public string? Category { get; set; }
    public bool IsPublic { get; set; } = true;
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? TrainingVideos { get; set; }
}
