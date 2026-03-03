using Deviny.Application.Common;
using Deviny.Application.Features.Trainers.DTOs;
using MediatR;

namespace Deviny.Application.Features.Trainers.Queries;

public record GetAllTrainersQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResponse<PublicTrainerDto>>;
