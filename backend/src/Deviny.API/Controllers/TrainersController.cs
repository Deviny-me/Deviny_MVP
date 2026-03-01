using Deviny.Application.Features.Trainers.DTOs;
using Deviny.Application.Features.Trainers.Queries;
using Deviny.API.DTOs;
using Deviny.Application.Common.Interfaces;
using Deviny.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Deviny.API.Controllers;

[Route("api/trainers")]
public class TrainersController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly ITrainerProfileRepository _trainerProfileRepository;
    private readonly IUserRepository _userRepository;
    private readonly ApplicationDbContext _context;

    public TrainersController(
        IMediator mediator,
        ITrainerProfileRepository trainerProfileRepository,
        IUserRepository userRepository,
        ApplicationDbContext context)
    {
        _mediator = mediator;
        _trainerProfileRepository = trainerProfileRepository;
        _userRepository = userRepository;
        _context = context;
    }

    /// <summary>
    /// Get all trainers for browsing
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<PublicTrainerDto>>> GetAll()
    {
        var query = new GetAllTrainersQuery();
        var trainers = await _mediator.Send(query);
        return Ok(trainers);
    }

    /// <summary>
    /// Get public trainer profile by slug
    /// </summary>
    [HttpGet("{slug}/profile")]
    [AllowAnonymous]
    public async Task<ActionResult<TrainerProfileResponse>> GetPublicProfile(string slug)
    {
        try
        {
            // Find trainer profile by slug
            var profile = await _context.TrainerProfiles
                .Include(p => p.Certificates.OrderBy(c => c.SortOrder))
                .Include(p => p.Specializations)
                    .ThenInclude(ts => ts.Specialization)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (profile == null)
            {
                return NotFound(new { message = "Trainer not found" });
            }

            // Get user info
            var user = await _userRepository.GetByIdAsync(profile.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Calculate initials
            var initials = GetInitials(user.FullName);

            // Map to response DTO
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
                    AchievementsCount = 0, // Now managed via /api/me/achievements
                    RatingValue = 0,
                    ReviewsCount = 0,
                    Slug = profile.Slug,
                    ProfilePublicUrl = $"/trainer/{profile.Slug}",
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
            return StatusCode(500, new { message = "Failed to load trainer profile", error = ex.Message });
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
