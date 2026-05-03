using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoursesPlatform.API.Models;
using CoursesPlatform.API.Models.DTOs;
using CoursesPlatform.API.Services;
using CoursesPlatform.API.Extensions;

namespace CoursesPlatform.API.Controllers;

[ApiController]
[Route("api/courses/{courseId}/videos")]
public class VideosController : ControllerBase
{
    private readonly CosmosDbService _db;
    private readonly BlobStorageService _blob;
    private readonly CdnService _cdn;
    private readonly ILogger<VideosController> _logger;

    public VideosController(CosmosDbService db, BlobStorageService blob, CdnService cdn, ILogger<VideosController> logger)
    {
        _db = db;
        _blob = blob;
        _cdn = cdn;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/courses/{courseId}/videos — List videos in a course
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<Video>>> GetAll(string courseId)
    {
        var videos = await _db.QueryAsync<Video>(courseId, "VIDEO");
        return Ok(videos);
    }

    /// <summary>
    /// POST /api/courses/{courseId}/videos — Upload a video (INSTRUCTOR only)
    /// Accepts multipart/form-data with a video file + metadata
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "INSTRUCTOR")]
    [RequestSizeLimit(500_000_000)] // 500 MB limit
    public async Task<ActionResult<Video>> Upload(string courseId, IFormFile file, [FromForm] string title, [FromForm] int duration)
    {
        // Verify course exists
        var course = await _db.GetAsync<Course>(courseId, courseId);
        if (course == null) return NotFound("Course not found");

        var userId = User.GetUserId();
        if (!CanModifyCourse(course, userId))
            return Forbid();

        // Upload video to blob storage
        var blobUrl = await _blob.UploadAsync(
            file.OpenReadStream(),
            file.FileName,
            "videos",
            file.ContentType);

        var cdnUrl = _cdn.GetCdnUrl(blobUrl);

        var video = new Video
        {
            Id = $"video_{Guid.NewGuid():N}",
            Pk = courseId,
            CourseId = courseId,
            Title = title,
            BlobUrl = blobUrl,
            CdnUrl = cdnUrl,
            Duration = duration,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _db.CreateAsync(video);
        return CreatedAtAction(nameof(GetAll), new { courseId }, created);
    }

    /// <summary>
    /// DELETE /api/courses/{courseId}/videos/{videoId} — Delete a video (INSTRUCTOR only)
    /// </summary>
    [HttpDelete("{videoId}")]
    [Authorize(Roles = "INSTRUCTOR")]
    public async Task<IActionResult> Delete(string courseId, string videoId)
    {
        var course = await _db.GetAsync<Course>(courseId, courseId);
        if (course == null) return NotFound("Course not found");

        var userId = User.GetUserId();
        if (!CanModifyCourse(course, userId))
            return Forbid();

        var video = await _db.GetAsync<Video>(videoId, courseId);
        if (video == null) return NotFound();

        // Delete blob
        if (!string.IsNullOrEmpty(video.BlobUrl))
        {
            await _blob.DeleteAsync(video.BlobUrl, "videos");
        }

        await _db.DeleteAsync(videoId, courseId);
        return NoContent();
    }

    private static bool CanModifyCourse(Course course, string userId)
    {
        if (string.IsNullOrWhiteSpace(course.InstructorId) || course.InstructorId == "unknown")
            return true;

        return course.InstructorId == userId || userId == "unknown";
    }
}
