using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Notifications.Events;
using Deviny.Domain.Entities;
using MediatR;

namespace Deviny.Application.Features.Friends.Commands;

public class FollowTrainerCommand : IRequest<Unit>
{
    public Guid FollowerId { get; set; }
    public Guid TrainerId { get; set; }
}

public class FollowTrainerCommandValidator : AbstractValidator<FollowTrainerCommand>
{
    public FollowTrainerCommandValidator()
    {
        RuleFor(x => x.FollowerId).NotEmpty();
        RuleFor(x => x.TrainerId).NotEmpty();
        RuleFor(x => x).Must(x => x.FollowerId != x.TrainerId)
            .WithMessage("Cannot follow yourself");
    }
}

public class FollowTrainerCommandHandler : IRequestHandler<FollowTrainerCommand, Unit>
{
    private readonly IUserFollowRepository _userFollowRepository;
    private readonly IUserBlockRepository _userBlockRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMediator _mediator;

    public FollowTrainerCommandHandler(
        IUserFollowRepository userFollowRepository,
        IUserBlockRepository userBlockRepository,
        IUserRepository userRepository,
        IMediator mediator)
    {
        _userFollowRepository = userFollowRepository;
        _userBlockRepository = userBlockRepository;
        _userRepository = userRepository;
        _mediator = mediator;
    }

    public async Task<Unit> Handle(FollowTrainerCommand request, CancellationToken cancellationToken)
    {
        // Check if target user exists.
        var targetUser = await _userRepository.GetByIdAsync(request.TrainerId)
            ?? throw new Exception("Target user not found");

        // Check for blocks
        var isBlocked = await _userBlockRepository.IsBlockedAsync(request.FollowerId, request.TrainerId);
        if (isBlocked)
            throw new Exception("Cannot follow due to block");

        // Check if already following
        var existingFollow = await _userFollowRepository.GetFollowAsync(request.FollowerId, request.TrainerId);
        if (existingFollow != null)
            throw new Exception("Already following");

        var follower = await _userRepository.GetByIdAsync(request.FollowerId)
            ?? throw new Exception("Follower not found");

        // Create follow
        var userFollow = new UserFollow
        {
            FollowerId = request.FollowerId,
            TrainerId = request.TrainerId,
            CreatedAt = DateTime.UtcNow
        };

        await _userFollowRepository.AddAsync(userFollow);

        // Publish real-time notification event
        await _mediator.Publish(new NewFollowerEvent
        {
            FollowerId = follower.Id,
            FollowerName = follower.FullName,
            FollowerAvatar = follower.AvatarUrl,
            TrainerId = targetUser.Id
        }, cancellationToken);

        return Unit.Value;
    }
}
