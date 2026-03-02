using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Notifications.Events;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Friends.Commands;

public class AcceptFriendRequestCommand : IRequest<Unit>
{
    public Guid UserId { get; set; }
    public int RequestId { get; set; }
}

public class AcceptFriendRequestCommandValidator : AbstractValidator<AcceptFriendRequestCommand>
{
    public AcceptFriendRequestCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.RequestId).GreaterThan(0);
    }
}

public class AcceptFriendRequestCommandHandler : IRequestHandler<AcceptFriendRequestCommand, Unit>
{
    private readonly IFriendRequestRepository _friendRequestRepository;
    private readonly IMediator _mediator;

    public AcceptFriendRequestCommandHandler(
        IFriendRequestRepository friendRequestRepository,
        IMediator mediator)
    {
        _friendRequestRepository = friendRequestRepository;
        _mediator = mediator;
    }

    public async Task<Unit> Handle(AcceptFriendRequestCommand request, CancellationToken cancellationToken)
    {
        var friendRequest = await _friendRequestRepository.GetByIdAsync(request.RequestId)
            ?? throw new Exception("Friend request not found");

        if (friendRequest.ReceiverId != request.UserId)
            throw new Exception("Unauthorized");

        if (friendRequest.Status != FriendRequestStatus.Pending)
            throw new Exception("Friend request is not pending");

        friendRequest.Status = FriendRequestStatus.Accepted;
        friendRequest.RespondedAt = DateTime.UtcNow;

        await _friendRequestRepository.UpdateAsync(friendRequest);

        // Publish real-time notification event
        await _mediator.Publish(new FriendRequestAcceptedEvent
        {
            RequestId = friendRequest.Id,
            AcceptorId = friendRequest.Receiver.Id,
            AcceptorName = friendRequest.Receiver.FullName,
            AcceptorAvatar = friendRequest.Receiver.AvatarUrl,
            OriginalSenderId = friendRequest.SenderId
        }, cancellationToken);

        return Unit.Value;
    }
}
