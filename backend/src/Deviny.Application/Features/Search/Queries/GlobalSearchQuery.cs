using Deviny.Application.DTOs.Search;
using MediatR;

namespace Deviny.Application.Features.Search.Queries;

public record GlobalSearchQuery(string Query, int Limit = 5) : IRequest<GlobalSearchResponse>;
