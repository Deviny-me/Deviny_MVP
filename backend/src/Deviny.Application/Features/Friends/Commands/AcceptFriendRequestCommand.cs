using FluentValidation;
using Deviny.Application.Common.Interfaces;
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

    public AcceptFriendRequestCommandHandler(IFriendRequestRepository friendRequestRepository)
    {
        _friendRequestRepository = friendRequestRepository;
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

        return Unit.Value;
    }
}
