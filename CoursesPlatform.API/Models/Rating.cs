using System.Text.Json.Serialization;

namespace CoursesPlatform.API.Models;

public class Rating : BaseDocument
{
    [JsonPropertyName("courseId")]
    public string CourseId { get; set; } = string.Empty;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("score")]
    public int Score { get; set; }

    public Rating()
    {
        Type = "RATING";
    }
}
