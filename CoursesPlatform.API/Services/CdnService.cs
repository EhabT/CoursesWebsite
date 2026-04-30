namespace CoursesPlatform.API.Services;

/// <summary>
/// Translates Azure Blob Storage URLs to Azure CDN endpoint URLs.
/// The CDN endpoint sits in front of the blob storage account to provide
/// edge-cached, low-latency delivery of media files globally.
/// </summary>
public class CdnService
{
    private readonly string _cdnEndpoint;
    private readonly string _blobHost;
    private readonly ILogger<CdnService> _logger;

    public CdnService(IConfiguration config, ILogger<CdnService> logger)
    {
        _cdnEndpoint = config["Cdn:Endpoint"] ?? "";
        _blobHost = config["Cdn:BlobHost"] ?? "";
        _logger = logger;
    }

    /// <summary>
    /// Converts a blob storage URL to a CDN URL by replacing the host.
    /// Example:
    ///   Blob: https://myaccount.blob.core.windows.net/videos/abc/file.mp4
    ///   CDN:  https://mycdn.azureedge.net/videos/abc/file.mp4
    /// </summary>
    public string GetCdnUrl(string blobUrl)
    {
        if (string.IsNullOrEmpty(_cdnEndpoint) || string.IsNullOrEmpty(_blobHost))
        {
            _logger.LogWarning("CDN not configured — returning original blob URL");
            return blobUrl;
        }

        var cdnUrl = blobUrl.Replace(_blobHost, _cdnEndpoint);
        _logger.LogInformation("CDN URL: {CdnUrl}", cdnUrl);
        return cdnUrl;
    }
}
