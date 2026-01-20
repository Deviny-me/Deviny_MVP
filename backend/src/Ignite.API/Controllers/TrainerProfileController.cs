using Ignite.API.DTOs;
using Ignite.Application.Common.Interfaces;
using Ignite.Domain.Entities;
using Ignite.Infrastructure.Persistence;
using Ignite.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Ignite.API.Controllers;

[ApiController]
[Route("api/trainer")]
[Authorize]
public class TrainerProfileController : ControllerBase
{
    private readonly ITrainerProfileRepository _trainerProfileRepository;
    private readonly IUserRepository _userRepository;
    private readonly SlugGenerator _slugGenerator;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public TrainerProfileController(
        ITrainerProfileRepository trainerProfileRepository,
        IUserRepository userRepository,
        SlugGenerator slugGenerator,
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _trainerProfileRepository = trainerProfileRepository;
        _userRepository = userRepository;
        _slugGenerator = slugGenerator;
        _configuration = configuration;
        _context = context;
    }

    [HttpGet("me/profile")]
    public async Task<ActionResult<TrainerProfileResponse>> GetMyProfile()
    {
        try
        {
            // Get current user ID from claims
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(emailClaim))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Check if user is a trainer
            if (user.Role != Domain.Enums.UserRole.Trainer)
            {
                return Forbid();
            }

            // Get or create trainer profile
            var profile = await _trainerProfileRepository.GetByUserIdWithDetailsAsync(user.Id);
            
            if (profile == null)
            {
                // Create a new profile with auto-generated slug
                var baseSlug = _slugGenerator.GenerateSlug(user.Name);
                var slug = baseSlug;
                var suffix = 1;
                
                while (!await _trainerProfileRepository.IsSlugUniqueAsync(slug))
                {
                    slug = _slugGenerator.GenerateSlug(user.Name, suffix);
                    suffix++;
                }

                profile = new TrainerProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Slug = slug,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                profile = await _trainerProfileRepository.CreateAsync(profile);
                
                // Reload with details
                profile = await _trainerProfileRepository.GetByUserIdWithDetailsAsync(user.Id);
            }

            if (profile == null)
            {
                return StatusCode(500, new { message = "Failed to create trainer profile" });
            }

            // Update user slug if not set
            if (string.IsNullOrEmpty(user.Slug))
            {
                user.Slug = profile.Slug;
                await _userRepository.UpdateAsync(user);
            }

            // Calculate initials
            var initials = GetInitials(user.Name);

            // Build profile public URL
            var clientAppUrl = _configuration["ClientAppUrl"] ?? "http://localhost:3000";
            var profilePublicUrl = $"{clientAppUrl}/public/trainer/{profile.Slug}";

            // Map to response DTO
            var response = new TrainerProfileResponse
            {
                Trainer = new TrainerDto
                {
                    Id = user.Id,
                    FullName = user.Name,
                    AvatarUrl = user.AvatarUrl,
                    Initials = initials,
                    PrimaryTitle = profile.PrimaryTitle,
                    SecondaryTitle = profile.SecondaryTitle,
                    Location = profile.Location,
                    ExperienceYears = profile.ExperienceYears,
                    ProgramsCount = profile.ProgramsCount,
                    StudentsCount = 0, // Placeholder - will be calculated from client relationships
                    AchievementsCount = profile.Achievements.Count,
                    RatingValue = 0, // Placeholder for future reviews
                    ReviewsCount = 0, // Placeholder for future reviews
                    Slug = profile.Slug,
                    ProfilePublicUrl = profilePublicUrl
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
                Achievements = profile.Achievements.Select(a => new AchievementDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Subtitle = a.Subtitle,
                    IconKey = a.IconKey,
                    Tone = a.Tone
                }).ToList(),
                Specializations = profile.Specializations
                    .Select(ts => new SpecializationDto
                    {
                        Id = ts.Specialization.Id,
                        Name = ts.Specialization.Name
                    })
                    .ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    private string GetInitials(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return "??";

        var words = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        
        if (words.Length == 0)
            return "??";
        
        if (words.Length == 1)
            return words[0].Substring(0, Math.Min(2, words[0].Length)).ToUpper();
        
        return (words[0][0].ToString() + words[1][0].ToString()).ToUpper();
    }

    [HttpPost("me/certificates")]
    public async Task<ActionResult<CertificateDto>> UploadCertificate(
        [FromForm] string title,
        [FromForm] string? issuer,
        [FromForm] int year,
        [FromForm] IFormFile file)
    {
        try
        {
            // Get current user
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(emailClaim))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Check if user is a trainer
            if (user.Role != Domain.Enums.UserRole.Trainer)
            {
                return Forbid();
            }

            // Get trainer profile
            var profile = await _trainerProfileRepository.GetByUserIdWithDetailsAsync(user.Id);
            if (profile == null)
            {
                return NotFound(new { message = "Trainer profile not found" });
            }

            // Validate file
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "File is required" });
            }

            // Validate file size (max 10MB)
            if (file.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size must not exceed 10MB" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Only PDF and image files are allowed" });
            }

            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "certificates");
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create certificate record
            var certificate = new TrainerCertificate
            {
                Id = Guid.NewGuid(),
                TrainerId = profile.Id,
                Title = title,
                Issuer = issuer,
                Year = year,
                FileUrl = $"/uploads/certificates/{fileName}",
                FileName = file.FileName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Add certificate directly to DbContext
            _context.TrainerCertificates.Add(certificate);
            await _context.SaveChangesAsync();

            // Return DTO
            var certificateDto = new CertificateDto
            {
                Id = certificate.Id,
                Title = certificate.Title,
                Issuer = certificate.Issuer,
                Year = certificate.Year,
                FileUrl = certificate.FileUrl,
                FileName = certificate.FileName
            };

            return CreatedAtAction(nameof(GetMyProfile), certificateDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while uploading the certificate", error = ex.Message });
        }
    }

    [HttpDelete("me/certificates/{certificateId}")]
    public async Task<ActionResult> DeleteCertificate(Guid certificateId)
    {
        try
        {
            // Get current user
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(emailClaim))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Check if user is a trainer
            if (user.Role != Domain.Enums.UserRole.Trainer)
            {
                return Forbid();
            }

            // Find certificate directly from database
            var certificate = await _context.TrainerCertificates
                .FirstOrDefaultAsync(c => c.Id == certificateId);
            
            if (certificate == null)
            {
                return NotFound(new { message = "Certificate not found" });
            }

            // Verify certificate belongs to user's trainer profile
            var profile = await _trainerProfileRepository.GetByUserIdAsync(user.Id);
            if (profile == null || certificate.TrainerId != profile.Id)
            {
                return NotFound(new { message = "Certificate not found" });
            }

            // Delete file from disk if it exists
            if (!string.IsNullOrEmpty(certificate.FileUrl))
            {
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", certificate.FileUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }

            // Delete certificate from database
            _context.TrainerCertificates.Remove(certificate);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the certificate", error = ex.Message });
        }
    }

    [HttpPut("me/about")]
    public async Task<ActionResult> UpdateAbout([FromBody] UpdateAboutRequest request)
    {
        try
        {
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(emailClaim))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            var profile = await _trainerProfileRepository.GetByUserIdAsync(user.Id);
            if (profile == null)
            {
                return NotFound(new { message = "Trainer profile not found" });
            }

            profile.AboutText = request.Text;
            await _trainerProfileRepository.UpdateAsync(profile);

            return Ok(new { message = "About text updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating about text", error = ex.Message });
        }
    }

    [HttpPost("me/specializations")]
    public async Task<ActionResult<SpecializationDto>> AddSpecialization([FromBody] AddSpecializationRequest request)
    {
        try
        {
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(emailClaim))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            var profile = await _trainerProfileRepository.GetByUserIdAsync(user.Id);
            if (profile == null)
            {
                return NotFound(new { message = "Trainer profile not found" });
            }

            // Check if specialization already exists in global list
            var existingSpec = await _context.Specializations
                .FirstOrDefaultAsync(s => s.Name == request.Name);

            Guid specializationId;
            if (existingSpec == null)
            {
                // Create new specialization
                var newSpec = new Specialization
                {
                    Id = Guid.NewGuid(),
                    Name = request.Name,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Specializations.Add(newSpec);
                await _context.SaveChangesAsync();
                specializationId = newSpec.Id;
            }
            else
            {
                specializationId = existingSpec.Id;
            }

            // Check if trainer already has this specialization
            var existingLink = await _context.TrainerSpecializations
                .FirstOrDefaultAsync(ts => ts.TrainerId == profile.Id && ts.SpecializationId == specializationId);

            if (existingLink != null)
            {
                return BadRequest(new { message = "Specialization already added" });
            }

            // Create link between trainer and specialization
            var trainerSpec = new TrainerSpecialization
            {
                TrainerId = profile.Id,
                SpecializationId = specializationId
            };

            _context.TrainerSpecializations.Add(trainerSpec);
            await _context.SaveChangesAsync();

            return Ok(new SpecializationDto
            {
                Id = specializationId,
                Name = request.Name
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while adding specialization", error = ex.Message });
        }
    }

    [HttpDelete("me/specializations/{specializationId}")]
    public async Task<ActionResult> DeleteSpecialization(Guid specializationId)
    {
        try
        {
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(emailClaim))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userRepository.GetByEmailAsync(emailClaim);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            var profile = await _trainerProfileRepository.GetByUserIdAsync(user.Id);
            if (profile == null)
            {
                return NotFound(new { message = "Trainer profile not found" });
            }

            var trainerSpec = await _context.TrainerSpecializations
                .FirstOrDefaultAsync(ts => ts.TrainerId == profile.Id && ts.SpecializationId == specializationId);
            
            if (trainerSpec == null)
            {
                return NotFound(new { message = "Specialization not found for this trainer" });
            }

            _context.TrainerSpecializations.Remove(trainerSpec);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting specialization", error = ex.Message });
        }
    }
}

public class UpdateAboutRequest
{
    public string? Text { get; set; }
}

public class AddSpecializationRequest
{
    public required string Name { get; set; }
}
