using FluentValidation;
using Ignite.Application.Common.Interfaces;
using Ignite.Application.DTOs;
using MediatR;

namespace Ignite.Application.Features.Friends.Queries;

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
            Id = f.Id,
            Email = f.Email,
            FullName = f.FullName,
            Avatar = f.AvatarUrl,
            FriendsSince = DateTime.UtcNow // This represents FollowingSince
        }).ToList();
    }
}
