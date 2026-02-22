using Deviny.API.DTOs;
using Deviny.Application.Common.Interfaces;
using Deviny.Domain.Entities;
using Deviny.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Deviny.API.Controllers;

[Route("api/nutritionist")]
public class NutritionistProfileController : BaseApiController
{
    private readonly ITrainerProfileRepository _trainerProfileRepository;
    private readonly IUserRepository _userRepository;
    private readonly ISlugGenerator _slugGenerator;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public NutritionistProfileController(
        ITrainerProfileRepository trainerProfileRepository,
        IUserRepository userRepository,
        ISlugGenerator slugGenerator,
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _trainerProfileRepository = trainerProfileRepository;
        _userRepository = userRepository;
        _slugGenerator = slugGenerator;
        _configuration = configuration;
        _context = context;
    }

    private async Task<Domain.Entities.User> GetNutritionistUserAsync()
    {
        var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        if (string.IsNullOrEmpty(emailClaim))
            throw new UnauthorizedAccessException("User not authenticated");

        var user = await _userRepository.GetByEmailAsync(emailClaim);
        if (user == null)
            throw new UnauthorizedAccessException("User not found");

        if (user.Role != Domain.Enums.UserRole.Nutritionist)
            throw new UnauthorizedAccessException("Nutritionist role required");

        return user;
    }

    [HttpGet("me/profile")]
    public async Task<ActionResult<TrainerProfileResponse>> GetMyProfile()
    {
        try
        {
            var user = await GetNutritionistUserAsync();

            // Get or create profile
            var profile = await _trainerProfileRepository.GetByUserIdWithDetailsAsync(user.Id);

            if (profile == null)
            {
                var baseSlug = _slugGenerator.GenerateSlug(user.FullName);
                var slug = baseSlug;
                var suffix = 1;

                while (!await _trainerProfileRepository.IsSlugUniqueAsync(slug))
                {
                    slug = _slugGenerator.GenerateSlug(user.FullName, suffix);
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
                profile = await _trainerProfileRepository.GetByUserIdWithDetailsAsync(user.Id);
            }

            if (profile == null)
                return StatusCode(500, new { message = "Failed to create nutritionist profile" });

            if (string.IsNullOrEmpty(user.Slug))
            {
                user.Slug = profile.Slug;
                await _userRepository.UpdateAsync(user);
            }

            var initials = GetInitials(user.FullName);
            var clientAppUrl = _configuration["ClientAppUrl"] ?? "http://localhost:3000";
            var profilePublicUrl = $"{clientAppUrl}/public/nutritionist/{profile.Slug}";

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
                    ProfilePublicUrl = profilePublicUrl,
                    Role = user.Role.ToString()
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    [HttpPut("me/profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateTrainerProfileRequest request)
    {
        try
        {
            var user = await GetNutritionistUserAsync();

            var profile = await _trainerProfileRepository.GetByUserIdWithDetailsAsync(user.Id);
            if (profile == null)
                return NotFound(new { message = "Nutritionist profile not found" });

            if (!string.IsNullOrEmpty(request.PrimaryTitle))
                profile.PrimaryTitle = request.PrimaryTitle;

            if (!string.IsNullOrEmpty(request.SecondaryTitle))
                profile.SecondaryTitle = request.SecondaryTitle;

            if (request.ExperienceYears.HasValue)
                profile.ExperienceYears = request.ExperienceYears.Value;

            if (!string.IsNullOrEmpty(request.Location))
                profile.Location = request.Location;

            profile.UpdatedAt = DateTime.UtcNow;
            await _trainerProfileRepository.UpdateAsync(profile);

            return Ok(new { message = "Profile updated successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
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
            var user = await GetNutritionistUserAsync();

            var profile = await _trainerProfileRepository.GetByUserIdWithDetailsAsync(user.Id);
            if (profile == null)
                return NotFound(new { message = "Nutritionist profile not found" });

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required" });

            if (file.Length > 10 * 1024 * 1024)
                return BadRequest(new { message = "File size must not exceed 10MB" });

            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest(new { message = "Only PDF and image files are allowed" });

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "certificates");
            Directory.CreateDirectory(uploadsPath);

            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

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

            _context.TrainerCertificates.Add(certificate);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyProfile), new CertificateDto
            {
                Id = certificate.Id,
                Title = certificate.Title,
                Issuer = certificate.Issuer,
                Year = certificate.Year,
                FileUrl = certificate.FileUrl,
                FileName = certificate.FileName
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
            var user = await GetNutritionistUserAsync();

            var certificate = await _context.TrainerCertificates
                .FirstOrDefaultAsync(c => c.Id == certificateId);

            if (certificate == null)
                return NotFound(new { message = "Certificate not found" });

            var profile = await _trainerProfileRepository.GetByUserIdAsync(user.Id);
            if (profile == null || certificate.TrainerId != profile.Id)
                return NotFound(new { message = "Certificate not found" });

            if (!string.IsNullOrEmpty(certificate.FileUrl))
            {
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", certificate.FileUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);
            }

            _context.TrainerCertificates.Remove(certificate);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
            var user = await GetNutritionistUserAsync();

            var profile = await _trainerProfileRepository.GetByUserIdAsync(user.Id);
            if (profile == null)
                return NotFound(new { message = "Nutritionist profile not found" });

            profile.AboutText = request.Text;
            await _trainerProfileRepository.UpdateAsync(profile);

            return Ok(new { message = "About text updated successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
            var user = await GetNutritionistUserAsync();

            var profile = await _trainerProfileRepository.GetByUserIdAsync(user.Id);
            if (profile == null)
                return NotFound(new { message = "Nutritionist profile not found" });

            var existingSpec = await _context.Specializations
                .FirstOrDefaultAsync(s => s.Name == request.Name);

            Guid specializationId;
            if (existingSpec == null)
            {
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

            var existingLink = await _context.TrainerSpecializations
                .FirstOrDefaultAsync(ts => ts.TrainerId == profile.Id && ts.SpecializationId == specializationId);

            if (existingLink != null)
                return BadRequest(new { message = "Specialization already added" });

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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
            var user = await GetNutritionistUserAsync();

            var profile = await _trainerProfileRepository.GetByUserIdAsync(user.Id);
            if (profile == null)
                return NotFound(new { message = "Nutritionist profile not found" });

            var trainerSpec = await _context.TrainerSpecializations
                .FirstOrDefaultAsync(ts => ts.TrainerId == profile.Id && ts.SpecializationId == specializationId);

            if (trainerSpec == null)
                return NotFound(new { message = "Specialization not found" });

            _context.TrainerSpecializations.Remove(trainerSpec);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting specialization", error = ex.Message });
        }
    }

    [HttpPost("me/avatar")]
    public async Task<ActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        try
        {
            var user = await GetNutritionistUserAsync();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Файл не выбран" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Размер файла не должен превышать 5 МБ" });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest(new { message = "Допустимые форматы: JPG, JPEG, PNG, GIF" });

            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                var oldAvatarPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.AvatarUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldAvatarPath))
                    System.IO.File.Delete(oldAvatarPath);
            }

            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            Directory.CreateDirectory(uploadPath);
            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var avatarUrl = $"/uploads/avatars/{fileName}";
            user.AvatarUrl = avatarUrl;
            await _userRepository.UpdateAsync(user);

            return Ok(new { message = "Аватар успешно загружен", avatarUrl });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при загрузке аватара", error = ex.Message });
        }
    }

    [HttpDelete("me/avatar")]
    public async Task<ActionResult> DeleteAvatar()
    {
        try
        {
            var user = await GetNutritionistUserAsync();

            if (string.IsNullOrEmpty(user.AvatarUrl))
                return NotFound(new { message = "Аватар не найден" });

            var avatarPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.AvatarUrl.TrimStart('/'));
            if (System.IO.File.Exists(avatarPath))
                System.IO.File.Delete(avatarPath);

            user.AvatarUrl = null;
            await _userRepository.UpdateAsync(user);

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при удалении аватара", error = ex.Message });
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
}
