using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Friends.Commands;

public class DeclineFriendRequestCommand : IRequest<Unit>
{
    public Guid UserId { get; set; }
    public int RequestId { get; set; }
}

public class DeclineFriendRequestCommandValidator : AbstractValidator<DeclineFriendRequestCommand>
{
    public DeclineFriendRequestCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.RequestId).GreaterThan(0);
    }
}

public class DeclineFriendRequestCommandHandler : IRequestHandler<DeclineFriendRequestCommand, Unit>
{
    private readonly IFriendRequestRepository _friendRequestRepository;

    public DeclineFriendRequestCommandHandler(IFriendRequestRepository friendRequestRepository)
    {
        _friendRequestRepository = friendRequestRepository;
    }

    public async Task<Unit> Handle(DeclineFriendRequestCommand request, CancellationToken cancellationToken)
    {
        var friendRequest = await _friendRequestRepository.GetByIdAsync(request.RequestId)
            ?? throw new Exception("Friend request not found");

        if (friendRequest.ReceiverId != request.UserId)
            throw new Exception("Unauthorized");

        if (friendRequest.Status != FriendRequestStatus.Pending)
            throw new Exception("Friend request is not pending");

        friendRequest.Status = FriendRequestStatus.Declined;
        friendRequest.RespondedAt = DateTime.UtcNow;

        await _friendRequestRepository.UpdateAsync(friendRequest);

        return Unit.Value;
    }
}
