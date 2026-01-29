using Ignite.Application.Features.Programs.DTOs;
using MediatR;

namespace Ignite.Application.Features.Programs.Queries;

public record GetAllPublicProgramsQuery : IRequest<List<PublicProgramDto>>;
