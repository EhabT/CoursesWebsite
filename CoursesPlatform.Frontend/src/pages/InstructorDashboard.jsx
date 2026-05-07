import React, { useState, useEffect, useRef } from 'react';
import { coursesApi, videosApi, uploadApi } from '../services/api';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // create course fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');

  // thumbnail for create modal
  const [thumbPreview, setThumbPreview] = useState('');
  const [thumbCdnUrl, setThumbCdnUrl] = useState('');
  const [aiTags, setAiTags] = useState([]);
  const [thumbBusy, setThumbBusy] = useState(false);
  const thumbInputRef = useRef(null);

  // video upload fields
  const [uploadFile, setUploadFile] = useState(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidDur, setVidDur] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setLoading(true); setCourses(await coursesApi.getMine()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function closeCreateModal() {
    setShowModal(null);
    setNewTitle(''); setNewDesc(''); setNewTags('');
    setThumbPreview(''); setThumbCdnUrl(''); setAiTags([]);
  }

  async function handleThumbPick(e) {
    const f = e.target.files[0];
    if (!f) return;
    setThumbPreview(URL.createObjectURL(f));
    setThumbCdnUrl('');
    setAiTags([]);
    setThumbBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const r = await uploadApi.image(fd);
      setThumbCdnUrl(r.cdnUrl);
      if (r.autoTags?.length) {
        setAiTags(r.autoTags);
        // Auto-merge AI tags into the tags field
        setNewTags(prev => {
          const existing = prev.split(',').map(t => t.trim()).filter(Boolean);
          const merged = [...new Set([...existing, ...r.autoTags])];
          return merged.join(', ');
        });
      }
    } catch (err) {
      alert('Image upload failed: ' + (err.message || 'Unknown error'));
      setThumbPreview('');
    } finally {
      setThumbBusy(false);
    }
  }

  function toggleAiTag(tag) {
    setNewTags(prev => {
      const existing = prev.split(',').map(t => t.trim()).filter(Boolean);
      if (existing.includes(tag)) {
        return existing.filter(t => t !== tag).join(', ');
      }
      return [...existing, tag].join(', ');
    });
  }

  function isTagActive(tag) {
    return newTags.split(',').map(t => t.trim()).includes(tag);
  }

  async function createCourse(e) {
    e.preventDefault(); setBusy(true);
    try {
      const c = await coursesApi.create({
        title: newTitle,
        description: newDesc,
        thumbnailUrl: thumbCdnUrl,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setCourses([c, ...courses]);
      closeCreateModal();
    } catch (e) { alert(e.message || 'Failed - log in as INSTRUCTOR'); }
    finally { setBusy(false); }
  }

  async function uploadVideo(e) {
    e.preventDefault(); if (!uploadFile) return; setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', vidTitle);
      fd.append('duration', vidDur || '0');
      await videosApi.upload(selectedCourseId, fd);
      alert('Uploaded!');
      setShowModal(null);
    } catch (e) { alert(e.message || 'Upload failed'); }
    finally { setBusy(false); }
  }

  async function deleteCourse(id) {
    if (!confirm('Delete this course and all its content?')) return;
    try { await coursesApi.delete(id); setCourses(courses.filter(c => c.id !== id)); }
    catch (e) { alert(e.message || 'Delete failed'); }
  }

  async function uploadThumb(cid) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      const fd = new FormData(); fd.append('file', f);
      try {
        const r = await uploadApi.image(fd);
        await coursesApi.update(cid, { thumbnailUrl: r.cdnUrl });
        load();
        if (r.autoTags?.length) alert('AI Tags: ' + r.autoTags.join(', '));
        else alert('Thumbnail updated!');
      } catch (e) { alert(e.message || 'Failed'); }
    };
    inp.click();
  }

  return (
    <div className="page"><div className="container">
      <div className="section-header">
        <h1 className="section-title">🎓 Instructor Dashboard</h1>
        <button id="create-course-btn" className="btn btn-primary" onClick={() => setShowModal('create')}>+ New Course</button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stat"><div className="label">My Courses</div><div className="value">{courses.length}</div></div>
        <div className="dashboard-stat"><div className="label">Platform</div><div className="value" style={{ fontSize: '1.2rem' }}>Azure AKS</div></div>
        <div className="dashboard-stat"><div className="label">Storage</div><div className="value" style={{ fontSize: '1.2rem' }}>Blob + CDN</div></div>
      </div>

      {loading ? (
        <div className="spinner-overlay"><div className="spinner" /></div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📝</div>
          <h3>No courses yet</h3>
          <p>Create your first course to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {courses.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '20px', gap: '16px', flexWrap: 'wrap' }}>
              <div
                style={{ width: '80px', height: '56px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#1e1b4b,#312e81)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => uploadThumb(c.id)}
                title="Click to replace thumbnail"
              >
                {c.thumbnailUrl
                  ? <img src={c.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '1.4rem' }}>📷</span>}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{c.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description}</div>
                {c.tags?.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {c.tags.map(t => (
                      <span key={t} className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedCourseId(c.id); setShowModal('upload'); }}>📹 Add Video</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteCourse(c.id)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Course Modal ── */}
      {showModal === 'create' && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Course</h2>
            <form onSubmit={createCourse}>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={newDesc} onChange={e => setNewDesc(e.target.value)} required />
              </div>

              {/* Thumbnail + AI tagging */}
              <div className="form-group">
                <label className="form-label">Thumbnail</label>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleThumbPick}
                />
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Preview box */}
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    style={{ width: '120px', height: '80px', borderRadius: 'var(--radius-sm)', border: '2px dashed var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
                    title="Click to pick image"
                  >
                    {thumbPreview
                      ? <img src={thumbPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '2rem' }}>{thumbBusy ? '⏳' : '🖼️'}</span>}
                  </div>

                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => thumbInputRef.current?.click()}
                      disabled={thumbBusy}
                    >
                      {thumbBusy ? '⏳ Analysing…' : thumbCdnUrl ? '✅ Change Image' : 'Choose Image'}
                    </button>

                    {thumbBusy && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Uploading to Azure Blob + running Azure AI Vision tagging…
                      </div>
                    )}

                    {/* AI suggested tags */}
                    {aiTags.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                          🤖 Azure AI Vision detected (click to toggle):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {aiTags.map(tag => (
                            <span
                              key={tag}
                              onClick={() => toggleAiTag(tag)}
                              className="tag"
                              style={{ cursor: 'pointer', fontSize: '0.72rem', padding: '2px 8px', opacity: isTagActive(tag) ? 1 : 0.45, outline: isTagActive(tag) ? '1px solid var(--accent)' : 'none' }}
                              title={isTagActive(tag) ? 'Click to remove' : 'Click to add'}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input
                  className="form-input"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="e.g. python, beginner, data-science"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy || thumbBusy}>
                  {busy ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upload Video Modal ── */}
      {showModal === 'upload' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Upload Video</h2>
            <form onSubmit={uploadVideo}>
              <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={vidTitle} onChange={e => setVidTitle(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Duration (sec)</label><input className="form-input" type="number" value={vidDur} onChange={e => setVidDur(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">File</label><input className="form-input" type="file" accept="video/*" onChange={e => setUploadFile(e.target.files[0])} required /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div></div>
  );
}
