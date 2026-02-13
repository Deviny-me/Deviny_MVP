using FluentValidation;
using Deviny.Application.Common.Interfaces;
using MediatR;

namespace Deviny.Application.Features.Friends.Commands;

public class RemoveFriendCommand : IRequest<Unit>
{
    public Guid UserId { get; set; }
    public Guid FriendId { get; set; }
}

public class RemoveFriendCommandValidator : AbstractValidator<RemoveFriendCommand>
{
    public RemoveFriendCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.FriendId).NotEmpty();
        RuleFor(x => x).Must(x => x.UserId != x.FriendId)
            .WithMessage("Cannot remove yourself");
    }
}

public class RemoveFriendCommandHandler : IRequestHandler<RemoveFriendCommand, Unit>
{
    private readonly IFriendRequestRepository _friendRequestRepository;

    public RemoveFriendCommandHandler(IFriendRequestRepository friendRequestRepository)
    {
        _friendRequestRepository = friendRequestRepository;
    }

    public async Task<Unit> Handle(RemoveFriendCommand request, CancellationToken cancellationToken)
    {
        var areFriends = await _friendRequestRepository.AreFriendsAsync(request.UserId, request.FriendId);
        if (!areFriends)
            throw new Exception("Not friends");

        await _friendRequestRepository.DeleteFriendshipAsync(request.UserId, request.FriendId);

        return Unit.Value;
    }
}
