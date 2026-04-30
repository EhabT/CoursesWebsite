import React, { useState, useEffect } from 'react';
import { ratingsApi } from '../services/api';

/**
 * RatingStars — displays average rating and allows students to rate a course.
 */
export default function RatingStars({ courseId }) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRating();
  }, [courseId]);

  async function loadRating() {
    try {
      const data = await ratingsApi.getAverage(courseId);
      setAverage(data.average);
      setCount(data.count);
    } catch (err) {
      console.error('Failed to load rating:', err);
    }
  }

  async function handleRate(score) {
    try {
      setSubmitting(true);
      await ratingsApi.create(courseId, { score });
      setSelected(score);
      await loadRating(); // Refresh average
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already rated') || msg.includes('409')) {
        alert('You have already rated this course.');
      } else {
        alert('Failed to submit rating. Please log in as a student.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="rating-section" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      {/* Display average */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '2rem',
          fontWeight: 800,
          background: 'var(--gradient-warm)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {average > 0 ? average.toFixed(1) : '—'}
        </span>
        <div>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= Math.round(average) ? 'filled' : ''}`}
                style={{ cursor: 'default', fontSize: '1.2rem' }}
              >
                ★
              </span>
            ))}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {count} {count === 1 ? 'rating' : 'ratings'}
          </span>
        </div>
      </div>

      {/* Rate interactively */}
      <div style={{
        borderLeft: '1px solid var(--border)',
        paddingLeft: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rate:</span>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= (hovered || selected) ? 'filled' : ''}`}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => !submitting && handleRate(star)}
              style={{ opacity: submitting ? 0.5 : 1 }}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
