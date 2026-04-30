namespace CoursesPlatform.API.Models.DTOs;

// ── Course DTOs ──
public record CreateCourseDto(string Title, string Description, string ThumbnailUrl, List<string> Tags);
public record UpdateCourseDto(string? Title, string? Description, string? ThumbnailUrl, List<string>? Tags);

// ── Video DTOs ──
public record CreateVideoDto(string Title, int Duration);

// ── Comment DTOs ──
public record CreateCommentDto(string Text, string? VideoId);

// ── Rating DTOs ──
public record CreateRatingDto(int Score);

// ── Enrolment DTOs ──
public record CreateEnrolmentDto(string CourseId);

// ── Response DTOs ──
public record AverageRatingDto(double Average, int Count);
public record UploadResultDto(string BlobUrl, string CdnUrl, List<string>? AutoTags);
