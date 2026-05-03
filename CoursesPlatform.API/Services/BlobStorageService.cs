using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace CoursesPlatform.API.Services;

/// <summary>
/// Manages file uploads to Azure Blob Storage.
/// Supports separate containers for videos and images.
/// </summary>
public class BlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly IConfiguration _config;
    private readonly ILogger<BlobStorageService> _logger;

    public BlobStorageService(BlobServiceClient blobServiceClient, IConfiguration config, ILogger<BlobStorageService> logger)
    {
        _blobServiceClient = blobServiceClient;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Uploads a file to the specified blob container and returns the blob URL.
    /// </summary>
    public async Task<string> UploadAsync(Stream fileStream, string fileName, string containerName, string contentType)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

        // Generate a unique blob name to avoid collisions
        var blobName = $"{Guid.NewGuid()}/{fileName}";
        var blobClient = containerClient.GetBlobClient(blobName);

        await blobClient.UploadAsync(fileStream, new BlobHttpHeaders { ContentType = contentType });
        _logger.LogInformation("Uploaded blob {BlobName} to container {Container}", blobName, containerName);

        return blobClient.Uri.ToString();
    }

    /// <summary>
    /// Deletes a blob by its full URL.
    /// </summary>
    public async Task DeleteAsync(string blobUrl, string containerName)
    {
        if (string.IsNullOrWhiteSpace(blobUrl))
            return;

        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var uri = new Uri(blobUrl);
        var segments = uri.Segments
            .Select(segment => segment.Trim('/'))
            .Where(segment => !string.IsNullOrWhiteSpace(segment))
            .ToList();
        var containerIndex = segments.FindIndex(segment =>
            segment.Equals(containerName, StringComparison.OrdinalIgnoreCase));

        if (containerIndex < 0 || containerIndex == segments.Count - 1)
        {
            throw new InvalidOperationException($"Could not resolve blob name from URL '{blobUrl}'.");
        }

        var blobName = string.Join("/", segments.Skip(containerIndex + 1));
        var blobClient = containerClient.GetBlobClient(blobName);

        await blobClient.DeleteIfExistsAsync();
        _logger.LogInformation("Deleted blob {BlobUrl}", blobUrl);
    }
}
