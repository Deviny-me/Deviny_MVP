using FluentValidation;
using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs;
using MediatR;

namespace Deviny.Application.Features.Friends.Queries;

public class GetMyFollowersQuery : IRequest<PagedResponse<FriendDto>>
{
    public Guid UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 30;
}

public class GetMyFollowersQueryValidator : AbstractValidator<GetMyFollowersQuery>
{
    public GetMyFollowersQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class GetMyFollowersQueryHandler : IRequestHandler<GetMyFollowersQuery, PagedResponse<FriendDto>>
{
    private readonly IUserFollowRepository _userFollowRepository;

    public GetMyFollowersQueryHandler(IUserFollowRepository userFollowRepository)
    {
        _userFollowRepository = userFollowRepository;
    }

    public async Task<PagedResponse<FriendDto>> Handle(GetMyFollowersQuery request, CancellationToken cancellationToken)
    {
        var (followers, totalCount) = await _userFollowRepository.GetFollowersPagedAsync(request.UserId, request.Page, request.PageSize);

        var dtos = followers.Select(f => new FriendDto
        {
            Id = f.Follower.Id,
            Email = f.Follower.Email,
            FullName = f.Follower.FullName,
            Avatar = f.Follower.AvatarUrl,
            Role = f.Follower.Role.ToString(),
            FriendsSince = f.FollowedAt
        }).ToList();

        return new PagedResponse<FriendDto>(dtos, totalCount, request.Page, request.PageSize);
    }
}
