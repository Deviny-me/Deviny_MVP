using Deviny.Application.Features.Reviews.DTOs;
using MediatR;

namespace Deviny.Application.Features.Reviews.Queries;

public record GetProgramReviewsQuery(Guid ProgramId, string ProgramType) : IRequest<List<ReviewDto>>;
