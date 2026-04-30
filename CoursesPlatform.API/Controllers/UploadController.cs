using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoursesPlatform.API.Models.DTOs;
using CoursesPlatform.API.Services;

namespace CoursesPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly BlobStorageService _blob;
    private readonly CdnService _cdn;
    private readonly CognitiveService _cognitive;
    private readonly ILogger<UploadController> _logger;

    public UploadController(
        BlobStorageService blob,
        CdnService cdn,
        CognitiveService cognitive,
        ILogger<UploadController> logger)
    {
        _blob = blob;
        _cdn = cdn;
        _cognitive = cognitive;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/upload/image — INSTRUCTOR only: upload an image to blob storage
    /// Runs Azure Cognitive Services auto-tagging on the uploaded image.
    /// </summary>
    [HttpPost("image")]
    [Authorize(Roles = "INSTRUCTOR")]
    [RequestSizeLimit(10_000_000)] // 10 MB
    public async Task<ActionResult<UploadResultDto>> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest("Invalid image type. Allowed: JPEG, PNG, GIF, WebP");

        // Upload to blob storage
        using var stream = file.OpenReadStream();
        var blobUrl = await _blob.UploadAsync(stream, file.FileName, "images", file.ContentType);
        var cdnUrl = _cdn.GetCdnUrl(blobUrl);

        // Auto-tag using Cognitive Services
        List<string>? autoTags = null;
        using var tagStream = file.OpenReadStream();
        autoTags = await _cognitive.GetImageTagsAsync(tagStream);

        return Ok(new UploadResultDto(blobUrl, cdnUrl, autoTags));
    }

    /// <summary>
    /// POST /api/upload/video — INSTRUCTOR only: upload a video to blob storage
    /// </summary>
    [HttpPost("video")]
    [Authorize(Roles = "INSTRUCTOR")]
    [RequestSizeLimit(500_000_000)] // 500 MB
    public async Task<ActionResult<UploadResultDto>> UploadVideo([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        var allowedTypes = new[] { "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest("Invalid video type. Allowed: MP4, WebM, MOV, AVI");

        using var stream = file.OpenReadStream();
        var blobUrl = await _blob.UploadAsync(stream, file.FileName, "videos", file.ContentType);
        var cdnUrl = _cdn.GetCdnUrl(blobUrl);

        return Ok(new UploadResultDto(blobUrl, cdnUrl, null));
    }
}
