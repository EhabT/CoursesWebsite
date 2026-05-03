using System.Security.Claims;

namespace CoursesPlatform.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal user)
    {
        // Try to get the user's unique identifier from the token.
        // .NET automatically maps "sub" to ClaimTypes.NameIdentifier and "oid" to ClaimTypes.ObjectId
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("sub")?.Value
            ?? user.FindFirst(ClaimTypes.ObjectId)?.Value
            ?? user.FindFirst("oid")?.Value
            ?? "unknown";

        return userId;
    }
}
