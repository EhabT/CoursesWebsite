import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CourseCard — displays a course preview in the grid.
 * Shows thumbnail, title, description, tags, and rating.
 */
export default function CourseCard({ course, rating }) {
  return (
    <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" id={`course-card-${course.id}`}>
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="card-image"
          />
        ) : (
          <div
            className="card-image"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              fontSize: '3rem',
            }}
          >
            📚
          </div>
        )}
        <div className="card-body">
          <h3 className="card-title">{course.title}</h3>
          <p className="card-description">{course.description}</p>
          {course.tags && course.tags.length > 0 && (
            <div className="card-tags">
              {course.tags.slice(0, 3).map((tag) => (
                <span className="tag" key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="card-footer">
          <div className="stat-badge">
            ⭐ {rating ? `${rating.average} (${rating.count})` : 'No ratings'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            View course →
          </span>
        </div>
      </div>
    </Link>
  );
}
