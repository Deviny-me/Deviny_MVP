using Deviny.Application.Common.Interfaces;
using Deviny.Application.Features.Auth.DTOs;
using Deviny.Domain.Entities;
using Deviny.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace Deviny.Application.Features.Auth.Commands;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, LoginResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly ITrainerProfileRepository _trainerProfileRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ISlugGenerator _slugGenerator;
    private readonly ILogger<RegisterCommandHandler> _logger;
    private readonly IVerificationDocumentService _verificationDocumentService;

    public RegisterCommandHandler(
        IUserRepository userRepository,
        ITrainerProfileRepository trainerProfileRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ISlugGenerator slugGenerator,
        ILogger<RegisterCommandHandler> logger,
        IVerificationDocumentService verificationDocumentService)
    {
        _userRepository = userRepository;
        _trainerProfileRepository = trainerProfileRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _slugGenerator = slugGenerator;
        _logger = logger;
        _verificationDocumentService = verificationDocumentService;
    }

    public async Task<LoginResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Registration attempt for email: {Email}, role: {Role}", 
            request.Email, request.Role);

        // Check if email already exists
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            _logger.LogWarning("Registration failed: Email {Email} already exists", request.Email);
            throw new InvalidOperationException("Email already registered");
        }

        // Hash password
        var passwordHash = _passwordHasher.HashPassword(request.Password);

        var userId = Guid.NewGuid();
        var userSlug = GenerateUserSlugWithId(request.FirstName, request.LastName, userId);

        // Create new user
        var user = new User
        {
            Id = userId,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PasswordHash = passwordHash,
            Role = request.Role,
            Phone = request.Phone,
            Slug = userSlug,
            Gender = request.Gender,
            Country = request.Country,
            City = request.City,
            HasInjuries = request.HasInjuries,
            IsActive = true,
            IsEmailConfirmed = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            RefreshTokens = new List<RefreshToken>()
        };

        await _userRepository.CreateAsync(user);

        if (request.HasInjuries && request.InjuryDocument != null)
        {
            var injuryDoc = await _verificationDocumentService.SaveVerificationDocumentAsync(
                user.Id,
                request.InjuryDocument,
                cancellationToken);

            user.InjuryDocUrl = injuryDoc.FilePath;
            await _userRepository.UpdateAsync(user);

            _logger.LogInformation("Injury document uploaded for user: {UserId}", user.Id);
        }

        _logger.LogInformation("User registered successfully: {Email}, Id: {UserId}", 
            user.Email, user.Id);

        // Handle trainer and nutritionist specific setup: create profile and add verification document as certificate
        if (request.Role == UserRole.Trainer || request.Role == UserRole.Nutritionist)
        {
            var slug = GenerateUserSlugWithId(user.FirstName, user.LastName, user.Id);

            // Create trainer profile
            var trainerProfile = new TrainerProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Slug = slug,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Certificates = new List<TrainerCertificate>()
            };

            // If verification document uploaded, add it as certificate
            if (request.VerificationDocument != null)
            {
                var verificationDoc = await _verificationDocumentService.SaveVerificationDocumentAsync(
                    user.Id, 
                    request.VerificationDocument, 
                    cancellationToken);
                
                _logger.LogInformation("Verification document uploaded for trainer/nutritionist: {UserId}", user.Id);

                // Add document as certificate
                var certificate = new TrainerCertificate
                {
                    Id = Guid.NewGuid(),
                    TrainerId = trainerProfile.Id,
                    Title = "Документ подтверждения квалификации",
                    Issuer = null,
                    Year = DateTime.UtcNow.Year,
                    SortOrder = 0,
                    FileUrl = verificationDoc.FilePath,
                    FileName = verificationDoc.FileName,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                trainerProfile.Certificates.Add(certificate);
            }

            await _trainerProfileRepository.CreateAsync(trainerProfile);
            
            // Keep user slug aligned with expert public slug.
            user.Slug = slug;
            await _userRepository.UpdateAsync(user);

            _logger.LogInformation("Trainer profile created for user: {UserId}, slug: {Slug}", user.Id, slug);
        }

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email, user.Role.ToString());
        var refreshTokenValue = _tokenService.GenerateRefreshToken();
        var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        // Create refresh token entity
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = refreshTokenExpiry,
            IsRememberMe = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddRefreshTokenAsync(refreshToken);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                Role = user.Role,
                Country = user.Country,
                City = user.City
            }
        };
    }

    private string GenerateUserSlugWithId(string firstName, string lastName, Guid userId)
    {
        var fullName = $"{firstName} {lastName}".Trim();
        var baseSlug = _slugGenerator.GenerateSlug(fullName);
        var idPart = userId.ToString("N");

        const int maxSlugLength = 100;
        var maxBaseLength = maxSlugLength - idPart.Length - 1; // minus dash before id

        if (baseSlug.Length > maxBaseLength)
        {
            baseSlug = baseSlug.Substring(0, maxBaseLength).Trim('-');
        }

        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            baseSlug = "user";
        }

        var slug = $"{baseSlug}-{idPart}";
        return Regex.Replace(slug, "-+", "-").Trim('-');
    }
}
