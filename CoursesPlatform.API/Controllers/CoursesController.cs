using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoursesPlatform.API.Models;
using CoursesPlatform.API.Models.DTOs;
using CoursesPlatform.API.Services;
using CoursesPlatform.API.Extensions;

namespace CoursesPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly CosmosDbService _db;
    private readonly BlobStorageService _blob;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(CosmosDbService db, BlobStorageService blob, ILogger<CoursesController> logger)
    {
        _db = db;
        _blob = blob;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/courses — Public: list all courses
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<Course>>> GetAll()
    {
        var courses = await _db.QueryByTypeAsync<Course>("COURSE");
        return Ok(courses);
    }

    /// <summary>
    /// GET /api/courses/{id} — Public: get course details
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<Course>> GetById(string id)
    {
        var course = await _db.GetAsync<Course>(id, id); // pk = course id for COURSE docs
        if (course == null) return NotFound();
        return Ok(course);
    }

    /// <summary>
    /// POST /api/courses — INSTRUCTOR only: create a new course
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "INSTRUCTOR")]
    public async Task<ActionResult<Course>> Create([FromBody] CreateCourseDto dto)
    {
        var userId = User.GetUserId();

        var course = new Course
        {
            Id = $"course_{Guid.NewGuid():N}",
            Pk = "", // will be set below
            Title = dto.Title,
            Description = dto.Description,
            InstructorId = userId,
            ThumbnailUrl = dto.ThumbnailUrl,
            Tags = dto.Tags ?? new List<string>(),
            CreatedAt = DateTime.UtcNow
        };
        course.Pk = course.Id; // COURSE docs partition by their own ID

        var created = await _db.CreateAsync(course);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// PUT /api/courses/{id} — INSTRUCTOR only: update course
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "INSTRUCTOR")]
    public async Task<ActionResult<Course>> Update(string id, [FromBody] UpdateCourseDto dto)
    {
        var course = await _db.GetAsync<Course>(id, id);
        if (course == null) return NotFound();

        // Only the course owner can update
        var userId = User.GetUserId();
        if (course.InstructorId != userId && userId != "unknown")
            return Forbid();

        if (dto.Title != null) course.Title = dto.Title;
        if (dto.Description != null) course.Description = dto.Description;
        if (dto.ThumbnailUrl != null) course.ThumbnailUrl = dto.ThumbnailUrl;
        if (dto.Tags != null) course.Tags = dto.Tags;

        var updated = await _db.UpdateAsync(course);
        return Ok(updated);
    }

    /// <summary>
    /// DELETE /api/courses/{id} — INSTRUCTOR only: delete course
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "INSTRUCTOR")]
    public async Task<IActionResult> Delete(string id)
    {
        var course = await _db.GetAsync<Course>(id, id);
        if (course == null) return NotFound();

        var userId = User.GetUserId();
        if (course.InstructorId != userId && userId != "unknown")
            return Forbid();

        // 1. Delete associated videos (and their blobs)
        var videos = await _db.QueryAsync<Video>(id, "VIDEO");
        foreach (var video in videos)
        {
            if (!string.IsNullOrEmpty(video.BlobUrl))
            {
                await _blob.DeleteAsync(video.BlobUrl, "videos");
            }
            await _db.DeleteAsync(video.Id, id);
        }

        // 2. Delete comments
        var comments = await _db.QueryAsync<Comment>(id, "COMMENT");
        foreach (var comment in comments)
        {
            await _db.DeleteAsync(comment.Id, id);
        }

        // 3. Delete ratings
        var ratings = await _db.QueryAsync<Rating>(id, "RATING");
        foreach (var rating in ratings)
        {
            await _db.DeleteAsync(rating.Id, id);
        }

        // 4. Delete enrolments (cross-partition query since they are partitioned by userId)
        var enrolments = await _db.SqlQueryAsync<Enrolment>(
            "SELECT * FROM c WHERE c.type = 'ENROLMENT' AND c.courseId = @courseId",
            new Dictionary<string, object> { { "@courseId", id } });
        foreach (var enrolment in enrolments)
        {
            await _db.DeleteAsync(enrolment.Id, enrolment.Pk);
        }

        // Finally, delete the course itself
        await _db.DeleteAsync(id, id);
        return NoContent();
    }
}
