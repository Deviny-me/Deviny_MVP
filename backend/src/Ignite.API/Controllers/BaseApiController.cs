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
}
