using System.Text.Json.Serialization;

namespace CoursesPlatform.API.Models;

public class Video : BaseDocument
{
    [JsonPropertyName("courseId")]
    public string CourseId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("blobUrl")]
    public string BlobUrl { get; set; } = string.Empty;

    [JsonPropertyName("cdnUrl")]
    public string CdnUrl { get; set; } = string.Empty;

    [JsonPropertyName("duration")]
    public int Duration { get; set; }

    [JsonPropertyName("autoTags")]
    public List<string> AutoTags { get; set; } = new();

    public Video()
    {
        Type = "VIDEO";
    }
}
