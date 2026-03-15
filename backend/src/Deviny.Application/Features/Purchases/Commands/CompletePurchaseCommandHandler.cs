using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Purchases.Commands;

public class CompletePurchaseCommandHandler : IRequestHandler<CompletePurchaseCommand, CompletePurchaseResult>
{
    private readonly IProgramPurchaseRepository _purchaseRepository;

    public CompletePurchaseCommandHandler(IProgramPurchaseRepository purchaseRepository)
    {
        _purchaseRepository = purchaseRepository;
    }

    public async Task<CompletePurchaseResult> Handle(CompletePurchaseCommand request, CancellationToken cancellationToken)
    {
        var updated = await _purchaseRepository.MarkCompletedAsync(request.UserId, request.PurchaseId);
        if (!updated)
            return CompletePurchaseResult.Fail("Purchase not found or cannot be completed.");

        return CompletePurchaseResult.Ok();
    }
}
