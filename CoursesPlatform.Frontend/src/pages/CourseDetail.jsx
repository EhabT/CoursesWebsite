import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import CommentSection from '../components/CommentSection';
import RatingStars from '../components/RatingStars';
import { coursesApi, videosApi, enrolmentsApi } from '../services/api';

/**
 * CourseDetail — full course page with videos, comments, ratings, and enrolment.
 */
export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

  async function loadCourse() {
    try {
      setLoading(true);
      const [courseData, videosData] = await Promise.all([
        coursesApi.getById(id),
        videosApi.getByCourse(id).catch(() => []),
      ]);
      setCourse(courseData);
      setVideos(videosData);
      if (videosData.length > 0) setSelectedVideo(videosData[0]);
    } catch (err) {
      console.error('Failed to load course:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnrol() {
    try {
      setEnrolling(true);
      await enrolmentsApi.enrol({ courseId: id });
      alert('Successfully enrolled! 🎉');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Already enrolled') || msg.includes('409')) {
        alert('You are already enrolled in this course.');
      } else {
        alert('Failed to enrol. Please log in as a student.');
      }
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page container">
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>Course not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* Course Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>{course.title}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '700px', marginBottom: '16px' }}>
                {course.description}
              </p>
              {course.tags && course.tags.length > 0 && (
                <div className="card-tags">
                  {course.tags.map((tag) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              id="enrol-btn"
              className="btn btn-primary btn-lg"
              onClick={handleEnrol}
              disabled={enrolling}
            >
              {enrolling ? 'Enrolling...' : '🎓 Enrol Now'}
            </button>
          </div>

          {/* Rating */}
          <div style={{ marginTop: '20px' }}>
            <RatingStars courseId={id} />
          </div>
        </div>

        {/* Video + Sidebar Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '40px' }}>
          {/* Main Video */}
          <div>
            <VideoPlayer video={selectedVideo} />
          </div>

          {/* Video List Sidebar */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}>
              📹 Course Videos ({videos.length})
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {videos.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No videos yet
                </div>
              ) : (
                videos.map((video, index) => (
                  <div
                    key={video.id}
                    id={`video-item-${video.id}`}
                    onClick={() => setSelectedVideo(video)}
                    style={{
                      padding: '12px 20px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: selectedVideo?.id === video.id ? 'rgba(129, 140, 248, 0.08)' : 'transparent',
                      borderLeft: selectedVideo?.id === video.id ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px' }}>
                      {index + 1}. {video.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}>
          <CommentSection courseId={id} />
        </div>
      </div>
    </div>
  );
}
