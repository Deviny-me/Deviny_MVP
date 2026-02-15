using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Achievements.DTOs;
using Deviny.Domain.Enums;
using MediatR;

namespace Deviny.Application.Features.Achievements.Queries;

public class GetMyAchievementsQuery : IRequest<MyAchievementsResponse>
{
    public required Guid UserId { get; set; }
    public required UserRole UserRole { get; set; }
}

public class GetMyAchievementsQueryHandler : IRequestHandler<GetMyAchievementsQuery, MyAchievementsResponse>
{
    private readonly IAchievementRepository _achievementRepository;
    private readonly IUserAchievementRepository _userAchievementRepository;

    public GetMyAchievementsQueryHandler(
        IAchievementRepository achievementRepository,
        IUserAchievementRepository userAchievementRepository)
    {
        _achievementRepository = achievementRepository;
        _userAchievementRepository = userAchievementRepository;
    }

    public async Task<MyAchievementsResponse> Handle(
        GetMyAchievementsQuery request,
        CancellationToken cancellationToken)
    {
        // Get all active achievements
        var allAchievements = await _achievementRepository.GetAllActiveAsync(cancellationToken);
        
        // Filter by role: null = available to all, specific role = only for that role
        // Student is treated as User
        var effectiveRole = request.UserRole == UserRole.Student ? UserRole.User : request.UserRole;
        var filtered = allAchievements
            .Where(a => a.TargetRole == null || a.TargetRole == effectiveRole)
            .ToList();
        
        // Get user's unlocked achievements
        var userAchievements = await _userAchievementRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        var unlockedIds = userAchievements.ToDictionary(ua => ua.AchievementId, ua => ua);
        
        var dtos = filtered.Select(a =>
        {
            var isUnlocked = unlockedIds.TryGetValue(a.Id, out var ua);
            return new AchievementDto
            {
                Id = a.Id,
                Code = a.Code,
                Title = a.Title,
                Description = a.Description,
                IconKey = a.IconKey,
                ColorKey = a.ColorKey,
                Rarity = a.Rarity.ToString(),
                XpReward = a.XpReward,
                TargetRole = a.TargetRole?.ToString(),
                IsUnlocked = isUnlocked,
                AwardedAt = ua?.AwardedAt
            };
        })
        .OrderByDescending(a => a.IsUnlocked)
        .ThenByDescending(a => a.AwardedAt)
        .ToList();

        return new MyAchievementsResponse
        {
            All = dtos,
            UnlockedCount = dtos.Count(d => d.IsUnlocked),
            TotalCount = dtos.Count
        };
    }
}
