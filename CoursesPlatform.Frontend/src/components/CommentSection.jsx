import React, { useState, useEffect } from 'react';
import { commentsApi } from '../services/api';

/**
 * CommentSection — displays comments for a course and allows posting new ones.
 */
export default function CommentSection({ courseId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [courseId]);

  async function loadComments() {
    try {
      setLoading(true);
      const data = await commentsApi.getByCourse(courseId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setPosting(true);
      const comment = await commentsApi.create(courseId, { text: newComment });
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment. Make sure you are logged in as a student.');
    } finally {
      setPosting(false);
    }
  }

  function getInitial(userId) {
    return (userId || 'U').charAt(0).toUpperCase();
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  }

  if (loading) {
    return (
      <div className="spinner-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div id="comment-section">
      <div className="section-header">
        <h2 className="section-title">💬 Comments ({comments.length})</h2>
      </div>

      {/* Post comment form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div className="form-group">
          <textarea
            className="form-textarea"
            placeholder="Share your thoughts on this course..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={posting || !newComment.trim()}
        >
          {posting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💬</div>
          <h3>No comments yet</h3>
          <p>Be the first to share your thoughts!</p>
        </div>
      ) : (
        comments.map((comment) => (
          <div className="comment" key={comment.id}>
            <div className="comment-avatar">{getInitial(comment.userId)}</div>
            <div className="comment-body">
              <div className="comment-author">{comment.userId}</div>
              <div className="comment-text">{comment.text}</div>
              <div className="comment-time">{formatTime(comment.createdAt)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
