using Microsoft.AspNetCore.Http;

namespace Deviny.Application.Features.Programs.DTOs;

public class CreateProgramRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? TrainingVideos { get; set; }
}
