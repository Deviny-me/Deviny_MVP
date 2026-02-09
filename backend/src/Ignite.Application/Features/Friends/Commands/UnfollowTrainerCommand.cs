using FluentValidation;
using Ignite.Application.Common.Interfaces;
using MediatR;

namespace Ignite.Application.Features.Friends.Commands;

public class UnfollowTrainerCommand : IRequest<Unit>
{
    public Guid FollowerId { get; set; }
    public Guid TrainerId { get; set; }
}

public class UnfollowTrainerCommandValidator : AbstractValidator<UnfollowTrainerCommand>
{
    public UnfollowTrainerCommandValidator()
    {
        RuleFor(x => x.FollowerId).NotEmpty();
        RuleFor(x => x.TrainerId).NotEmpty();
    }
}

public class UnfollowTrainerCommandHandler : IRequestHandler<UnfollowTrainerCommand, Unit>
{
    private readonly IUserFollowRepository _userFollowRepository;

    public UnfollowTrainerCommandHandler(IUserFollowRepository userFollowRepository)
    {
        _userFollowRepository = userFollowRepository;
    }

    public async Task<Unit> Handle(UnfollowTrainerCommand request, CancellationToken cancellationToken)
    {
        var userFollow = await _userFollowRepository.GetFollowAsync(request.FollowerId, request.TrainerId)
            ?? throw new Exception("Not following");

        await _userFollowRepository.DeleteAsync(userFollow);

        return Unit.Value;
    }
}
