using FluentValidation;
using Ignite.Application.Common.Interfaces;
using Ignite.Application.DTOs;
using MediatR;

namespace Ignite.Application.Features.Friends.Queries;

public class GetMyFriendsQuery : IRequest<List<FriendDto>>
{
    public Guid UserId { get; set; }
}

public class GetMyFriendsQueryValidator : AbstractValidator<GetMyFriendsQuery>
{
    public GetMyFriendsQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class GetMyFriendsQueryHandler : IRequestHandler<GetMyFriendsQuery, List<FriendDto>>
{
    private readonly IFriendRequestRepository _friendRequestRepository;

    public GetMyFriendsQueryHandler(IFriendRequestRepository friendRequestRepository)
    {
        _friendRequestRepository = friendRequestRepository;
    }

    public async Task<List<FriendDto>> Handle(GetMyFriendsQuery request, CancellationToken cancellationToken)
    {
        var friends = await _friendRequestRepository.GetFriendsAsync(request.UserId);

        return friends.Select(f => new FriendDto
        {
            Id = f.Friend.Id,
            Email = f.Friend.Email,
            FullName = f.Friend.FullName,
            Avatar = f.Friend.AvatarUrl,
            FriendsSince = f.FriendsSince
        }).ToList();
    }
}
