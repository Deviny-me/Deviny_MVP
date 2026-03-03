using MediatR;

namespace Deviny.Application.Features.Purchases.Commands;

public class PurchaseProgramCommand : IRequest<PurchaseProgramResult>
{
    public Guid UserId { get; set; }
    public Guid ProgramId { get; set; }
    public string ProgramType { get; set; } = string.Empty; // "training" or "meal"
    public string Tier { get; set; } = string.Empty;        // "Basic", "Standard", "Pro"
}

public class PurchaseProgramResult
{
    public bool Success { get; set; }
    public Guid? PurchaseId { get; set; }
    public string? Error { get; set; }

    public static PurchaseProgramResult Ok(Guid purchaseId) => new() { Success = true, PurchaseId = purchaseId };
    public static PurchaseProgramResult Fail(string error) => new() { Success = false, Error = error };
}
