using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoursesPlatform.API.Models;
using CoursesPlatform.API.Models.DTOs;
using CoursesPlatform.API.Services;

namespace CoursesPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly CosmosDbService _db;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(CosmosDbService db, ILogger<CoursesController> logger)
    {
        _db = db;
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
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value ?? "unknown";

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
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value ?? "unknown";
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

        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value ?? "unknown";
        if (course.InstructorId != userId && userId != "unknown")
            return Forbid();

        await _db.DeleteAsync(id, id);
        return NoContent();
    }
}
