using FluentValidation;
using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Enums;
using MediatR;

namespace Ignite.Application.Features.Friends.Commands;

public class CancelFriendRequestCommand : IRequest<Unit>
{
    public Guid UserId { get; set; }
    public int RequestId { get; set; }
}

public class CancelFriendRequestCommandValidator : AbstractValidator<CancelFriendRequestCommand>
{
    public CancelFriendRequestCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.RequestId).GreaterThan(0);
    }
}

public class CancelFriendRequestCommandHandler : IRequestHandler<CancelFriendRequestCommand, Unit>
{
    private readonly IFriendRequestRepository _friendRequestRepository;

    public CancelFriendRequestCommandHandler(IFriendRequestRepository friendRequestRepository)
    {
        _friendRequestRepository = friendRequestRepository;
    }

    public async Task<Unit> Handle(CancelFriendRequestCommand request, CancellationToken cancellationToken)
    {
        var friendRequest = await _friendRequestRepository.GetByIdAsync(request.RequestId)
            ?? throw new Exception("Friend request not found");

        if (friendRequest.SenderId != request.UserId)
            throw new Exception("Unauthorized");

        if (friendRequest.Status != FriendRequestStatus.Pending)
            throw new Exception("Friend request is not pending");

        friendRequest.Status = FriendRequestStatus.Cancelled;
        friendRequest.RespondedAt = DateTime.UtcNow;

        await _friendRequestRepository.UpdateAsync(friendRequest);

        return Unit.Value;
    }
}
