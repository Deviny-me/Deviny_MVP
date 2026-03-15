using MediatR;

namespace Deviny.Application.Features.Purchases.Commands;

public class CompletePurchaseCommand : IRequest<CompletePurchaseResult>
{
    public Guid UserId { get; set; }
    public Guid PurchaseId { get; set; }
}

public class CompletePurchaseResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }

    public static CompletePurchaseResult Ok() => new() { Success = true };
    public static CompletePurchaseResult Fail(string error) => new() { Success = false, Error = error };
}
