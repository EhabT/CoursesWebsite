using System.Security.Claims;

namespace CoursesPlatform.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    // Stable, immutable identity claims checked in priority order.
    // Email/preferred_username are intentionally excluded — they are mutable
    // and must never be stored as the owner identifier for documents.
    private static readonly string[] StableIdClaimTypes =
    [
        ClaimTypes.NameIdentifier,
        "sub",
        "http://schemas.microsoft.com/identity/claims/objectidentifier",
        "oid",
    ];

    // Returns the first non-empty stable identifier found in the token.
    // Deterministic: always uses the same priority order, never a HashSet.
    public static string GetUserId(this ClaimsPrincipal user)
    {
        foreach (var type in StableIdClaimTypes)
        {
            var value = user.FindFirstValue(type);
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }
        return "unknown";
    }

    // Returns all stable identifier values for ownership checks (CanModifyCourse).
    // Used as a set so any of the stable IDs can match the stored instructorId.
    public static IReadOnlySet<string> GetUserIds(this ClaimsPrincipal user)
    {
        return StableIdClaimTypes
            .SelectMany(type => user.FindAll(type))
            .Select(claim => claim.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
