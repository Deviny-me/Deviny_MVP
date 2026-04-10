using Deviny.Application.Common;
using Deviny.Application.Features.Trainers.DTOs;
using Deviny.API.DTOs.Requests;
using Deviny.API.DTOs.Responses;
using Deviny.API.DTOs.Shared;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Enums;
using Deviny.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Deviny.API.Controllers;

/// <summary>
/// Public browsing of nutritionist profiles.
/// Only returns users with Role == Nutritionist.
/// </summary>
[Route("api/nutritionists")]
public class NutritionistExpertsController : BaseApiController
{
    private readonly ITrainerProfileRepository _trainerProfileRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly ApplicationDbContext _context;

    public NutritionistExpertsController(
        ITrainerProfileRepository trainerProfileRepository,
        IUserRepository userRepository,
        IFileStorageService fileStorage,
        ApplicationDbContext context)
    {
        _trainerProfileRepository = trainerProfileRepository;
        _userRepository = userRepository;
        _fileStorage = fileStorage;
        _context = context;
    }

    /// <summary>
    /// Get all nutritionists for browsing (paginated)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResponse<PublicTrainerDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? country = null,
        [FromQuery] string? city = null,
        [FromQuery] string? gender = null,
        [FromQuery] string? specialization = null,
        [FromQuery] double? minRating = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 100) pageSize = 100;

        var query = _context.TrainerProfiles
            .AsNoTracking()
            .Include(tp => tp.User)
            .Include(tp => tp.Specializations)
                .ThenInclude(ts => ts.Specialization)
            .Where(tp => tp.User != null && tp.User.Role == UserRole.Nutritionist);

        if (!string.IsNullOrWhiteSpace(country))
            query = query.Where(tp => tp.User != null && tp.User.Country != null &&
                EF.Functions.ILike(tp.User.Country, country));

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(tp => tp.User != null && tp.User.City != null &&
                EF.Functions.ILike(tp.User.City, city));

        if (!string.IsNullOrWhiteSpace(gender) && Enum.TryParse<Domain.Enums.Gender>(gender, true, out var genderEnum))
            query = query.Where(tp => tp.User != null && tp.User.Gender == genderEnum);

        if (!string.IsNullOrWhiteSpace(specialization))
            query = query.Where(tp => tp.Specializations.Any(s =>
                s.Specialization != null && EF.Functions.ILike(s.Specialization.Name, $"%{specialization}%")));

        var totalCount = await query.CountAsync();

        var nutritionists = await query
            .OrderByDescending(tp => tp.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = nutritionists.Select(t => new PublicTrainerDto
        {
            Id = t.Id,
            UserId = t.UserId,
            Name = t.User?.FullName ?? "Unknown Nutritionist",
            AvatarUrl = string.IsNullOrEmpty(t.User?.AvatarUrl)
                ? ""
                : _fileStorage.GetPublicUrl(t.User.AvatarUrl),
            PrimaryTitle = t.PrimaryTitle,
            SecondaryTitle = t.SecondaryTitle,
            Location = t.Location,
            ExperienceYears = t.ExperienceYears,
            Slug = t.Slug,
            Role = t.User?.Role.ToString() ?? "Nutritionist",
            ProgramsCount = t.ProgramsCount,
            Specializations = t.Specializations
                .Select(s => s.Specialization?.Name ?? "")
                .Where(name => !string.IsNullOrEmpty(name))
                .ToList()
        }).ToList();

        return Ok(new PagedResponse<PublicTrainerDto>(items, totalCount, page, pageSize));
    }

    /// <summary>
    /// Get public nutritionist profile by slug
    /// </summary>
    [HttpGet("{slug}/profile")]
    [AllowAnonymous]
    public async Task<ActionResult<TrainerProfileResponse>> GetPublicProfile(string slug)
    {
        try
        {
            var profile = await _context.TrainerProfiles
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.Certificates.OrderBy(c => c.SortOrder))
                .Include(p => p.Specializations)
                    .ThenInclude(ts => ts.Specialization)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (profile == null)
                return NotFound(new { message = "Nutritionist not found" });

            var user = profile.User;
            if (user == null || user.Role != UserRole.Nutritionist)
                return NotFound(new { message = "Nutritionist not found" });

            var initials = GetInitials(user.FullName);

            var response = new TrainerProfileResponse
            {
                Trainer = new TrainerDto
                {
                    Id = profile.Id,
                    UserId = user.Id,
                    FullName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    Initials = initials,
                    PrimaryTitle = profile.PrimaryTitle,
                    SecondaryTitle = profile.SecondaryTitle,
                    Location = profile.Location,
                    Gender = user.Gender?.ToString().ToLower(),
                    Phone = user.Phone,
                    Country = user.Country,
                    City = user.City,
                    ExperienceYears = profile.ExperienceYears,
                    ProgramsCount = profile.ProgramsCount,
                    StudentsCount = 0,
                    AchievementsCount = 0,
                    RatingValue = 0,
                    ReviewsCount = 0,
                    Slug = profile.Slug,
                    ProfilePublicUrl = $"/nutritionist/{profile.Slug}",
                    Role = user.Role.ToString(),
                    ActivityRatingValue = 0
                },
                About = new AboutDto
                {
                    Text = profile.AboutText
                },
                Certificates = profile.Certificates.Select(c => new CertificateDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Issuer = c.Issuer,
                    Year = c.Year,
                    FileUrl = c.FileUrl,
                    FileName = c.FileName
                }).ToList(),
                Specializations = profile.Specializations.Select(s => new SpecializationDto
                {
                    Id = s.Specialization.Id,
                    Name = s.Specialization.Name
                }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load nutritionist profile", error = ex.Message });
        }
    }

    private string GetInitials(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return "??";

        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
            return "??";
        if (parts.Length == 1)
            return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpper();

        return $"{parts[0][0]}{parts[^1][0]}".ToUpper();
    }
}


