using Deviny.Application.Features.Purchases.DTOs;
using MediatR;

namespace Deviny.Application.Features.Purchases.Queries;

public record GetMyPurchasesQuery(Guid UserId) : IRequest<List<PurchasedProgramDto>>;
