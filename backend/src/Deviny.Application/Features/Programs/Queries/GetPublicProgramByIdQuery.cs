using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public record GetPublicProgramByIdQuery : IRequest<PublicProgramDto?>
{
    public Guid Id { get; init; }
}
