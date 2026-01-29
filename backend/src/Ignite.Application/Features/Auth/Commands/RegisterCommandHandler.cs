using Ignite.Application.Common.Interfaces;
using Ignite.Application.Features.Auth.DTOs;
using Ignite.Domain.Entities;
using Ignite.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ignite.Application.Features.Auth.Commands;

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

        // Create new user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PasswordHash = passwordHash,
            Role = request.Role,
            Phone = request.Phone,
            Gender = request.Gender,
            Country = request.Country,
            City = request.City,
            IsActive = true,
            IsEmailConfirmed = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            RefreshTokens = new List<RefreshToken>()
        };

        await _userRepository.CreateAsync(user);

        _logger.LogInformation("User registered successfully: {Email}, Id: {UserId}", 
            user.Email, user.Id);

        // Handle trainer-specific setup: create profile and add verification document as certificate
        if (request.Role == UserRole.Trainer)
        {
            // Generate unique slug for trainer profile
            var baseSlug = _slugGenerator.GenerateSlug(user.FullName);
            var slug = baseSlug;
            var suffix = 1;
            
            while (!await _trainerProfileRepository.IsSlugUniqueAsync(slug))
            {
                slug = _slugGenerator.GenerateSlug(user.FullName, suffix);
                suffix++;
            }

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
                
                _logger.LogInformation("Verification document uploaded for trainer: {UserId}", user.Id);

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
            
            // Update user with slug
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
}
