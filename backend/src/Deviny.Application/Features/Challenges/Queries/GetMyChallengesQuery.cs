using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Challenges.DTOs;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Challenges.Queries;

public class GetMyChallengesQuery : IRequest<MyChallengesResponse>
{
    public required Guid UserId { get; set; }
    public required UserRole UserRole { get; set; }
}

public class GetMyChallengesQueryHandler : IRequestHandler<GetMyChallengesQuery, MyChallengesResponse>
{
    private readonly IChallengeRepository _challengeRepository;
    private readonly IUserChallengeProgressRepository _progressRepository;

    public GetMyChallengesQueryHandler(
        IChallengeRepository challengeRepository,
        IUserChallengeProgressRepository progressRepository)
    {
        _challengeRepository = challengeRepository;
        _progressRepository = progressRepository;
    }

    public async Task<MyChallengesResponse> Handle(
        GetMyChallengesQuery request,
        CancellationToken cancellationToken)
    {
        // Get all active challenges
        var allChallenges = await _challengeRepository.GetAllActiveAsync(cancellationToken);
        
        // Filter by role
        var effectiveRole = request.UserRole == UserRole.Student ? UserRole.User : request.UserRole;
        var filtered = allChallenges
            .Where(c => c.TargetRole == null || c.TargetRole == effectiveRole)
            .ToList();
        
        // Get user's progress
        var userProgress = await _progressRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        var progressMap = userProgress.ToDictionary(p => p.ChallengeId, p => p);
        
        var dtos = filtered.Select(c =>
        {
            progressMap.TryGetValue(c.Id, out var progress);
            var currentValue = progress?.CurrentValue ?? 0;
            var targetValue = c.TargetValue;
            var progressPercent = targetValue > 0 
                ? Math.Min(100, Math.Round((double)currentValue / targetValue * 100, 1)) 
                : 0;

            return new UserChallengeProgressDto
            {
                Challenge = new ChallengeDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    Title = c.Title,
                    Description = c.Description,
                    Type = c.Type.ToString(),
                    TargetValue = c.TargetValue,
                    TargetRole = c.TargetRole?.ToString(),
                    AchievementTitle = c.Achievement?.Title,
                    AchievementIconKey = c.Achievement?.IconKey,
                    AchievementColorKey = c.Achievement?.ColorKey
                },
                CurrentValue = currentValue,
                TargetValue = targetValue,
                Status = progress?.Status.ToString() ?? ChallengeStatus.Active.ToString(),
                CompletedAt = progress?.CompletedAt,
                ProgressPercent = progressPercent
            };
        })
        .OrderBy(d => d.Status == "Completed" ? 1 : 0)
        .ThenByDescending(d => d.ProgressPercent)
        .ToList();

        return new MyChallengesResponse
        {
            Challenges = dtos,
            CompletedCount = dtos.Count(d => d.Status == "Completed"),
            TotalCount = dtos.Count
        };
    }
}
