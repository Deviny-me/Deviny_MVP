using Ignite.Application.Features.Programs.DTOs;
using MediatR;

namespace Ignite.Application.Features.Programs.Queries;

public record GetPublicProgramByIdQuery : IRequest<PublicProgramDto?>
{
    public Guid Id { get; init; }
}
