using Ignite.Application.Common.Interfaces;
using MediatR;

namespace Ignite.Application.Features.Levels.Queries;

public class GetMyLevelQuery : IRequest<UserLevelDto>
{
    public Guid UserId { get; set; }
}
