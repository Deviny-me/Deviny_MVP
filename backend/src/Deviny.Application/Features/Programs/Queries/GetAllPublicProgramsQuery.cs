using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public record GetAllPublicProgramsQuery : IRequest<List<PublicProgramDto>>;
