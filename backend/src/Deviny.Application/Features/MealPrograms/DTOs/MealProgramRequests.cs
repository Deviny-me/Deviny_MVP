using Microsoft.AspNetCore.Http;

namespace Deviny.Application.Features.MealPrograms.DTOs;

public class CreateMealProgramRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public string? Category { get; set; }
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? Videos { get; set; }
}

public class UpdateMealProgramRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public string? Category { get; set; }
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? Videos { get; set; }
}
