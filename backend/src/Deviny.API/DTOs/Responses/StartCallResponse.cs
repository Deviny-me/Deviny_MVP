namespace Deviny.API.DTOs.Responses;

public class StartCallResponse
{
    public string CallUrl { get; set; } = null!;
    public string RoomId { get; set; } = null!;
    public Guid SessionId { get; set; }
}

