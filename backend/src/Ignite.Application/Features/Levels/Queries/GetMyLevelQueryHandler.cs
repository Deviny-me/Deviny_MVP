using Ignite.Application.Common.Interfaces;
using MediatR;

namespace Ignite.Application.Features.Levels.Queries;

public class GetMyLevelQueryHandler : IRequestHandler<GetMyLevelQuery, UserLevelDto>
{
    private readonly ILevelService _levelService;

    public GetMyLevelQueryHandler(ILevelService levelService)
    {
        _levelService = levelService;
    }

    public async Task<UserLevelDto> Handle(GetMyLevelQuery request, CancellationToken cancellationToken)
    {
        return await _levelService.GetUserLevelAsync(request.UserId);
    }
}
