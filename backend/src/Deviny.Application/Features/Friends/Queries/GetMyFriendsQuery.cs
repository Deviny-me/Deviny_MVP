using FluentValidation;
using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs;
using MediatR;

namespace Deviny.Application.Features.Friends.Queries;

public class GetMyFriendsQuery : IRequest<PagedResponse<FriendDto>>
{
    public Guid UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 30;
}

public class GetMyFriendsQueryValidator : AbstractValidator<GetMyFriendsQuery>
{
    public GetMyFriendsQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class GetMyFriendsQueryHandler : IRequestHandler<GetMyFriendsQuery, PagedResponse<FriendDto>>
{
    private readonly IFriendRequestRepository _friendRequestRepository;

    public GetMyFriendsQueryHandler(IFriendRequestRepository friendRequestRepository)
    {
        _friendRequestRepository = friendRequestRepository;
    }

    public async Task<PagedResponse<FriendDto>> Handle(GetMyFriendsQuery request, CancellationToken cancellationToken)
    {
        var (friends, totalCount) = await _friendRequestRepository.GetFriendsPagedAsync(request.UserId, request.Page, request.PageSize);

        var dtos = friends.Select(f => new FriendDto
        {
            Id = f.Friend.Id,
            Email = f.Friend.Email,
            FullName = f.Friend.FullName,
            Avatar = f.Friend.AvatarUrl,
            Role = f.Friend.Role.ToString(),
            FriendsSince = f.FriendsSince
        }).ToList();

        return new PagedResponse<FriendDto>(dtos, totalCount, request.Page, request.PageSize);
    }
}
