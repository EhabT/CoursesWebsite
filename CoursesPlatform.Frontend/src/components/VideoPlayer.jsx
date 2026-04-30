import React from 'react';

/**
 * VideoPlayer — renders a video with controls inside a styled wrapper.
 */
export default function VideoPlayer({ video }) {
  if (!video) {
    return (
      <div className="empty-state">
        <div className="icon">🎬</div>
        <h3>Select a video to play</h3>
      </div>
    );
  }

  return (
    <div className="video-player-wrapper" id={`video-player-${video.id}`}>
      <video
        controls
        src={video.cdnUrl || video.blobUrl}
        poster={video.thumbnailUrl}
        style={{ width: '100%' }}
      >
        Your browser does not support the video tag.
      </video>
      <div style={{
        padding: '16px 20px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>
          {video.title}
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : ''}
        </span>
        {video.autoTags && video.autoTags.length > 0 && (
          <div className="card-tags" style={{ marginTop: '8px' }}>
            {video.autoTags.map((tag) => (
              <span className="tag" key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
