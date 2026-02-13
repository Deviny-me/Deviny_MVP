namespace Deviny.API.DTOs;

public class CertificateDto
{
    public required Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Issuer { get; set; }
    public required int Year { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
}
