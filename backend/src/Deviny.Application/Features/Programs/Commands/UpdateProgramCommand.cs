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
    public decimal? ProPrice { get; set; }
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? TrainingVideos { get; set; }
}
