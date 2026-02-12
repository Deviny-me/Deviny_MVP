using Ignite.Application.DTOs.Search;
using MediatR;

namespace Ignite.Application.Features.Search.Queries;

public record GlobalSearchQuery(string Query, int Limit = 5) : IRequest<GlobalSearchResponse>;
