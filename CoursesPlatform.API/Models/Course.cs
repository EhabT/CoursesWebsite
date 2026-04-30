using System.Text.Json.Serialization;

namespace CoursesPlatform.API.Models;

public class Course : BaseDocument
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("instructorId")]
    public string InstructorId { get; set; } = string.Empty;

    [JsonPropertyName("thumbnailUrl")]
    public string ThumbnailUrl { get; set; } = string.Empty;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    public Course()
    {
        Type = "COURSE";
    }
}
