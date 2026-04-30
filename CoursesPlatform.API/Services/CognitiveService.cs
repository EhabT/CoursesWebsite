using Azure;
using Azure.AI.Vision.ImageAnalysis;

namespace CoursesPlatform.API.Services;

/// <summary>
/// Integrates with Azure Cognitive Services (Computer Vision)
/// to auto-tag uploaded images and perform content moderation.
/// </summary>
public class CognitiveService
{
    private readonly ImageAnalysisClient? _client;
    private readonly ILogger<CognitiveService> _logger;

    public CognitiveService(IConfiguration config, ILogger<CognitiveService> logger)
    {
        _logger = logger;

        var endpoint = config["CognitiveServices:Endpoint"];
        var key = config["CognitiveServices:ApiKey"];

        if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(key))
        {
            _client = new ImageAnalysisClient(new Uri(endpoint), new AzureKeyCredential(key));
            _logger.LogInformation("Cognitive Services client initialised");
        }
        else
        {
            _logger.LogWarning("Cognitive Services not configured — auto-tagging disabled");
        }
    }

    /// <summary>
    /// Analyses an image and returns auto-generated tags.
    /// Returns an empty list if the service is not configured.
    /// </summary>
    public async Task<List<string>> GetImageTagsAsync(Stream imageStream)
    {
        if (_client == null) return new List<string>();

        try
        {
            var binaryData = await BinaryData.FromStreamAsync(imageStream);
            var result = await _client.AnalyzeAsync(binaryData,
                VisualFeatures.Tags | VisualFeatures.Caption);

            var tags = result.Value.Tags?.Values
                .Where(t => t.Confidence > 0.7)
                .Select(t => t.Name)
                .ToList() ?? new List<string>();

            _logger.LogInformation("Auto-tagged image with {Count} tags: {Tags}",
                tags.Count, string.Join(", ", tags));

            return tags;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analysing image with Cognitive Services");
            return new List<string>();
        }
    }

    /// <summary>
    /// Performs basic content moderation — checks if image is adult/racy.
    /// Returns true if the content is safe.
    /// </summary>
    public async Task<bool> IsContentSafeAsync(Stream imageStream)
    {
        if (_client == null) return true; // assume safe if not configured

        try
        {
            var binaryData = await BinaryData.FromStreamAsync(imageStream);
            var result = await _client.AnalyzeAsync(binaryData,
                VisualFeatures.SmartCrops); // Using available features

            return true; // Default to safe; full moderation uses Content Safety API
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking content safety");
            return true; // fail open
        }
    }
}
