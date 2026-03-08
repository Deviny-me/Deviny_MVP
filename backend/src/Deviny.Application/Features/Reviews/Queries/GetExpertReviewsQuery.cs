using Deviny.Application.Features.Reviews.DTOs;
using MediatR;

namespace Deviny.Application.Features.Reviews.Queries;

public record GetExpertReviewsQuery(Guid ExpertId) : IRequest<List<ExpertReviewDto>>;
