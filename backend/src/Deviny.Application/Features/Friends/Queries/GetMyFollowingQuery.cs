using FluentValidation;
using Deviny.Application.Common;
using Deviny.Application.Common.Interfaces;
using Deviny.Application.DTOs;
using MediatR;

namespace Deviny.Application.Features.Friends.Queries;

public class GetMyFollowingQuery : IRequest<PagedResponse<FriendDto>>
{
    public Guid UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 30;
}

public class GetMyFollowingQueryValidator : AbstractValidator<GetMyFollowingQuery>
{
    public GetMyFollowingQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class GetMyFollowingQueryHandler : IRequestHandler<GetMyFollowingQuery, PagedResponse<FriendDto>>
{
    private readonly IUserFollowRepository _userFollowRepository;

    public GetMyFollowingQueryHandler(IUserFollowRepository userFollowRepository)
    {
        _userFollowRepository = userFollowRepository;
    }

    public async Task<PagedResponse<FriendDto>> Handle(GetMyFollowingQuery request, CancellationToken cancellationToken)
    {
        var (following, totalCount) = await _userFollowRepository.GetFollowingPagedAsync(request.UserId, request.Page, request.PageSize);

        var dtos = following.Select(f => new FriendDto
        {
            Id = f.Trainer.Id,
            Email = f.Trainer.Email,
            FullName = f.Trainer.FullName,
            Avatar = f.Trainer.AvatarUrl,
            Role = f.Trainer.Role.ToString(),
            FriendsSince = f.FollowedAt
        }).ToList();

        return new PagedResponse<FriendDto>(dtos, totalCount, request.Page, request.PageSize);
    }
}
