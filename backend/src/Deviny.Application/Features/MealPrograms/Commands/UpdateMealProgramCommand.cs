using Deviny.Application.Features.MealPrograms.DTOs;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Deviny.Application.Features.MealPrograms.Commands;

public class UpdateMealProgramCommand : IRequest<MealProgramDto>
{
    public Guid Id { get; set; }
    public Guid TrainerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? ProPrice { get; set; }
    public string? Category { get; set; }
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? Videos { get; set; }
}
