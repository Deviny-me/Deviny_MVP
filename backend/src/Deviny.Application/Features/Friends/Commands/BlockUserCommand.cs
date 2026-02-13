using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using MediatR;

namespace Deviny.Application.Features.Friends.Commands;

public class BlockUserCommand : IRequest<Unit>
{
    public Guid BlockerId { get; set; }
    public Guid BlockedUserId { get; set; }
}

public class BlockUserCommandValidator : AbstractValidator<BlockUserCommand>
{
    public BlockUserCommandValidator()
    {
        RuleFor(x => x.BlockerId).NotEmpty();
        RuleFor(x => x.BlockedUserId).NotEmpty();
        RuleFor(x => x).Must(x => x.BlockerId != x.BlockedUserId)
            .WithMessage("Cannot block yourself");
    }
}

public class BlockUserCommandHandler : IRequestHandler<BlockUserCommand, Unit>
{
    private readonly IUserBlockRepository _userBlockRepository;
    private readonly IFriendRequestRepository _friendRequestRepository;
    private readonly IUserFollowRepository _userFollowRepository;
    private readonly IUserRepository _userRepository;

    public BlockUserCommandHandler(
        IUserBlockRepository userBlockRepository,
        IFriendRequestRepository friendRequestRepository,
        IUserFollowRepository userFollowRepository,
        IUserRepository userRepository)
    {
        _userBlockRepository = userBlockRepository;
        _friendRequestRepository = friendRequestRepository;
        _userFollowRepository = userFollowRepository;
        _userRepository = userRepository;
    }

    public async Task<Unit> Handle(BlockUserCommand request, CancellationToken cancellationToken)
    {
        // Check if user exists
        var blockedUser = await _userRepository.GetByIdAsync(request.BlockedUserId)
            ?? throw new Exception("User not found");

        // Check if already blocked
        var existingBlock = await _userBlockRepository.GetBlockAsync(request.BlockerId, request.BlockedUserId);
        if (existingBlock != null)
            throw new Exception("Already blocked");

        // Remove friendship if exists
        var areFriends = await _friendRequestRepository.AreFriendsAsync(request.BlockerId, request.BlockedUserId);
        if (areFriends)
        {
            await _friendRequestRepository.DeleteFriendshipAsync(request.BlockerId, request.BlockedUserId);
        }

        // Remove follows in both directions
        var follow1 = await _userFollowRepository.GetFollowAsync(request.BlockerId, request.BlockedUserId);
        if (follow1 != null)
        {
            await _userFollowRepository.DeleteAsync(follow1);
        }

        var follow2 = await _userFollowRepository.GetFollowAsync(request.BlockedUserId, request.BlockerId);
        if (follow2 != null)
        {
            await _userFollowRepository.DeleteAsync(follow2);
        }

        // Create block
        var userBlock = new UserBlock
        {
            BlockerId = request.BlockerId,
            BlockedUserId = request.BlockedUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _userBlockRepository.AddAsync(userBlock);

        return Unit.Value;
    }
}
