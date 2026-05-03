using System.Security.Claims;

namespace CoursesPlatform.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal user)
    {
        // Try to get the user's unique identifier from the token.
        // .NET automatically maps "sub" to ClaimTypes.NameIdentifier and "oid" to ClaimTypes.ObjectId
        var userId = user.GetUserIds().FirstOrDefault() ?? "unknown";

        return userId;
    }

    public static IReadOnlySet<string> GetUserIds(this ClaimsPrincipal user)
    {
        var claimTypes = new[]
        {
            ClaimTypes.NameIdentifier,
            "sub",
            "http://schemas.microsoft.com/identity/claims/objectidentifier",
            "oid",
            "preferred_username",
            "email",
            "emails",
            ClaimTypes.Email,
            ClaimTypes.Upn
        };

        return claimTypes
            .SelectMany(type => user.FindAll(type))
            .Select(claim => claim.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
