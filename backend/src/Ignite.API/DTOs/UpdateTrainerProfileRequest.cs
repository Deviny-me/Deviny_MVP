namespace Ignite.API.DTOs;

public class UpdateTrainerProfileRequest
{
    public string? PrimaryTitle { get; set; }
    public string? SecondaryTitle { get; set; }
    public int? ExperienceYears { get; set; }
    public string? Location { get; set; }
}
