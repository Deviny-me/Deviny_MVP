namespace Deviny.API.DTOs.Requests;

/// <summary>
/// Request body for purchasing a program
/// </summary>
public class PurchaseProgramRequest
{
    public Guid ProgramId { get; set; }
    public string ProgramType { get; set; } = string.Empty; // "training" or "meal"
    public string Tier { get; set; } = string.Empty;        // "Basic", "Standard", "Pro"
}

