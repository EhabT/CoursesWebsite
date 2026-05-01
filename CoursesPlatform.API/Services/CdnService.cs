namespace CoursesPlatform.API.Services;

/// <summary>
/// Translates Azure Blob Storage URLs to Cloudflare Worker CDN URLs.
/// A Cloudflare Worker sits in front of the blob storage account and provides
/// edge-cached, low-latency delivery of media files globally (free tier).
///
/// Blob URL:    https://[account].blob.core.windows.net/videos/abc/file.mp4
/// CDN URL:     https://courses-cdn.[you].workers.dev/videos/abc/file.mp4
///
/// The Worker proxies the request to blob storage and adds caching headers.
/// Configure Cdn:Endpoint and Cdn:BlobHost in appsettings.json.
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
    /// Converts a blob storage URL to a Cloudflare Worker CDN URL by replacing the host.
    /// Example:
    ///   Blob: https://myaccount.blob.core.windows.net/videos/abc/file.mp4
    ///   CDN:  https://courses-cdn.myuser.workers.dev/videos/abc/file.mp4
    /// Falls back to the original blob URL if CDN is not configured.
    /// </summary>
    public string GetCdnUrl(string blobUrl)
    {
        if (string.IsNullOrEmpty(_cdnEndpoint) || string.IsNullOrEmpty(_blobHost))
        {
            _logger.LogWarning("CDN not configured — returning original blob URL");
            return blobUrl;
        }

        var cdnUrl = blobUrl.Replace(_blobHost, _cdnEndpoint);
        _logger.LogInformation("Cloudflare CDN URL: {CdnUrl}", cdnUrl);
        return cdnUrl;
    }
}
