using System.Text.Json.Serialization;

namespace CoursesPlatform.API.Models;

/// <summary>
/// Base class for all Cosmos DB documents.
/// Uses a synthetic partition key (/pk) pattern.
/// </summary>
public abstract class BaseDocument
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("pk")]
    public string Pk { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
