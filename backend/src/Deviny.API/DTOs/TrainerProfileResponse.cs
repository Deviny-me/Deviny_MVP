namespace Deviny.API.DTOs;

public class TrainerProfileResponse
{
    public required TrainerDto Trainer { get; set; }
    public required AboutDto About { get; set; }
    public required List<CertificateDto> Certificates { get; set; }
    public required List<AchievementDto> Achievements { get; set; }
    public required List<SpecializationDto> Specializations { get; set; }
}
