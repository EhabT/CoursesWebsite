using System.Text.Json.Serialization;

namespace CoursesPlatform.API.Models;

public class Comment : BaseDocument
{
    [JsonPropertyName("courseId")]
    public string CourseId { get; set; } = string.Empty;

    [JsonPropertyName("videoId")]
    public string VideoId { get; set; } = string.Empty;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    public Comment()
    {
        Type = "COMMENT";
    }
}
