using FluentValidation;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs;
using MediatR;

namespace Deviny.Application.Features.Friends.Queries;

public class GetMyFollowingQuery : IRequest<List<FriendDto>>
{
    public Guid UserId { get; set; }
}

public class GetMyFollowingQueryValidator : AbstractValidator<GetMyFollowingQuery>
{
    public GetMyFollowingQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class GetMyFollowingQueryHandler : IRequestHandler<GetMyFollowingQuery, List<FriendDto>>
{
    private readonly IUserFollowRepository _userFollowRepository;

    public GetMyFollowingQueryHandler(IUserFollowRepository userFollowRepository)
    {
        _userFollowRepository = userFollowRepository;
    }

    public async Task<List<FriendDto>> Handle(GetMyFollowingQuery request, CancellationToken cancellationToken)
    {
        var following = await _userFollowRepository.GetFollowingAsync(request.UserId);

        return following.Select(f => new FriendDto
        {
            Id = f.Trainer.Id,
            Email = f.Trainer.Email,
            FullName = f.Trainer.FullName,
            Avatar = f.Trainer.AvatarUrl,
            FriendsSince = f.FollowedAt
        }).ToList();
    }
}
