using System.Text.Json.Serialization;

namespace CoursesPlatform.API.Models;

public class Enrolment : BaseDocument
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("courseId")]
    public string CourseId { get; set; } = string.Empty;

    [JsonPropertyName("enrolledAt")]
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    public Enrolment()
    {
        Type = "ENROLMENT";
    }
}
