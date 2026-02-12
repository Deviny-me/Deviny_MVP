using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ignite.API.Controllers;

[ApiController]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Gets the current authenticated user's ID from JWT claims
    /// </summary>
    /// <returns>The user ID as Guid</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown when user ID cannot be extracted or is invalid</exception>
    protected Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim))
        {
            throw new UnauthorizedAccessException("User identity not found in token");
        }

        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user identity format");
        }

        return userId;
    }

    /// <summary>
    /// Gets the current authenticated user's email from JWT claims
    /// </summary>
    /// <returns>The user email</returns>
    protected string GetCurrentUserEmail()
    {
        var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
        
        if (string.IsNullOrEmpty(emailClaim))
        {
            throw new UnauthorizedAccessException("User email not found in token");
        }

        return emailClaim;
    }

    /// <summary>
    /// Gets the current authenticated user's role from JWT claims
    /// </summary>
    /// <returns>The user role</returns>
    protected string? GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value;
    }

    /// <summary>
    /// Checks if the current user has the specified role
    /// </summary>
    protected bool IsInRole(string role)
    {
        return User.IsInRole(role);
    }

    /// <summary>
    /// Tries to get the current user's ID from JWT claims.
    /// Returns null if not authenticated (for [AllowAnonymous] endpoints).
    /// </summary>
    protected Guid? TryGetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        return userId;
    }

    /// <summary>
    /// Creates a standardized ProblemDetails response according to RFC 7807.
    /// </summary>
    protected static ProblemDetails CreateProblemDetails(string title, string detail, int status)
    {
        return new ProblemDetails
        {
            Type = status switch
            {
                400 => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                401 => "https://tools.ietf.org/html/rfc7235#section-3.1",
                403 => "https://tools.ietf.org/html/rfc7231#section-6.5.3",
                404 => "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                409 => "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                500 => "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                _ => "https://tools.ietf.org/html/rfc7231#section-6.5.1"
            },
            Title = title,
            Detail = detail,
            Status = status
        };
    }
}
