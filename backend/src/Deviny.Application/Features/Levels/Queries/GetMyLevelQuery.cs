using Deviny.Application.Features.Levels.DTOs;
using MediatR;

namespace Deviny.Application.Features.Levels.Queries;

public class GetMyLevelQuery : IRequest<UserLevelDto>
{
    public Guid UserId { get; set; }
}
