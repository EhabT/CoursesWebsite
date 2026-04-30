using System.Text.Json.Serialization;

namespace CoursesPlatform.API.Models;

public class AppUser : BaseDocument
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = "STUDENT"; // INSTRUCTOR or STUDENT

    public AppUser()
    {
        Type = "USER";
    }
}
