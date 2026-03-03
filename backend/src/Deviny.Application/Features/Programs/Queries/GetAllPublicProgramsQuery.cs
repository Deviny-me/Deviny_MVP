using Deviny.Application.Common;
using Deviny.Application.Features.Programs.DTOs;
using MediatR;

namespace Deviny.Application.Features.Programs.Queries;

public record GetAllPublicProgramsQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResponse<PublicProgramDto>>;
