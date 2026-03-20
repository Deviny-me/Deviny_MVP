namespace Deviny.API.DTOs.Requests;

public class UpdateTrainerProfileRequest
{
    public string? PrimaryTitle { get; set; }
    public string? SecondaryTitle { get; set; }
    public int? ExperienceYears { get; set; }
    public string? Location { get; set; }
    public string? Gender { get; set; }
}

