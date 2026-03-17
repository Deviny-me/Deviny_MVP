using Deviny.Application.Features.Programs.DTOs;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Deviny.Application.Features.Programs.Commands;

public class UpdateProgramCommand : IRequest<ProgramDto>
{
    public Guid Id { get; set; }
    public Guid TrainerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public decimal Price { get; set; }
    public decimal? StandardPrice { get; set; }
    public decimal? ProPrice { get; set; }
    public int? MaxStandardSpots { get; set; }
    public int? MaxProSpots { get; set; }
    public string? Category { get; set; }
    public bool IsPublic { get; set; } = true;
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? TrainingVideos { get; set; }
    public List<string>? TrainingVideoTitles { get; set; }
    public List<string>? TrainingVideoDescriptions { get; set; }
}
