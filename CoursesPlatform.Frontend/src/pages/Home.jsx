import React, { useState, useEffect } from 'react';
import CourseCard from '../components/CourseCard';
import { coursesApi, ratingsApi } from '../services/api';

/**
 * Home — landing page with hero section and course grid.
 */
export default function Home() {
  const [courses, setCourses] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data);

      // Load ratings for all courses in parallel
      const ratingPromises = data.map(async (course) => {
        try {
          const rating = await ratingsApi.getAverage(course.id);
          return { id: course.id, rating };
        } catch {
          return { id: course.id, rating: { average: 0, count: 0 } };
        }
      });
      const ratingResults = await Promise.all(ratingPromises);
      const ratingMap = {};
      ratingResults.forEach((r) => { ratingMap[r.id] = r.rating; });
      setRatings(ratingMap);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Learn Without Limits</h1>
          <p>
            Discover expert-led courses, watch high-quality videos, 
            and level up your skills — all on a platform built to scale.
          </p>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <input
              id="search-courses"
              className="form-input"
              type="text"
              placeholder="🔍  Search courses by title, tag, or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                textAlign: 'center',
                padding: '14px 24px',
                borderRadius: '40px',
                background: 'var(--bg-card)',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="container">
        <div className="section-header">
          <h2 className="section-title">
            {searchTerm ? `Results for "${searchTerm}"` : 'All Courses'}
          </h2>
          <span className="stat-badge">
            📚 {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
          </span>
        </div>

        {loading ? (
          <div className="spinner-overlay">
            <div className="spinner"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <h3>No courses found</h3>
            <p>{searchTerm ? 'Try a different search term.' : 'Check back soon for new courses!'}</p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                rating={ratings[course.id]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
