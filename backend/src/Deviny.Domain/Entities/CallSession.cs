using Deviny.Domain.Enums;

namespace Deviny.Domain.Entities;

public class CallSession : BaseEntity
{
    public required Guid EventId { get; set; }
    public ScheduleEvent? Event { get; set; }

    public required Guid TrainerId { get; set; }
    public User? Trainer { get; set; }

    public Guid? StudentId { get; set; }
    public User? Student { get; set; }

    public required CallSessionStatus Status { get; set; }
    public required string CallUrl { get; set; }
    public required string RoomId { get; set; }
}
