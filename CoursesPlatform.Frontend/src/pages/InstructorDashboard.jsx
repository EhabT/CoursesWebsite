import React, { useState, useEffect } from 'react';
import { coursesApi, videosApi, uploadApi } from '../services/api';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidDur, setVidDur] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setLoading(true); setCourses(await coursesApi.getAll()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function createCourse(e) {
    e.preventDefault(); setBusy(true);
    try {
      const c = await coursesApi.create({ title: newTitle, description: newDesc, thumbnailUrl: '', tags: newTags.split(',').map(t=>t.trim()).filter(Boolean) });
      setCourses([c, ...courses]); setShowModal(null); setNewTitle(''); setNewDesc(''); setNewTags('');
    } catch (e) { alert(e.message || 'Failed - log in as INSTRUCTOR'); }
    finally { setBusy(false); }
  }

  async function uploadVideo(e) {
    e.preventDefault(); if (!uploadFile) return; setBusy(true);
    try {
      const fd = new FormData(); fd.append('file', uploadFile); fd.append('title', vidTitle); fd.append('duration', vidDur||'0');
      await videosApi.upload(selectedCourseId, fd); alert('Uploaded!'); setShowModal(null);
    } catch (e) { alert(e.message || 'Upload failed'); }
    finally { setBusy(false); }
  }

  async function deleteCourse(id) {
    if (!confirm('Delete this course?')) return;
    try { await coursesApi.delete(id); setCourses(courses.filter(c=>c.id!==id)); } catch (e) { alert(e.message || 'Delete failed'); }
  }

  async function uploadThumb(cid) {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
    inp.onchange = async e => {
      const f=e.target.files[0]; if(!f) return;
      const fd=new FormData(); fd.append('file',f);
      try { const r=await uploadApi.image(fd); await coursesApi.update(cid,{thumbnailUrl:r.cdnUrl}); load();
        if(r.autoTags?.length) alert('Tags: '+r.autoTags.join(', ')); else alert('Done!');
      } catch (e) { alert(e.message || 'Failed'); }
    }; inp.click();
  }

  return (
    <div className="page"><div className="container">
      <div className="section-header">
        <h1 className="section-title">🎓 Instructor Dashboard</h1>
        <button id="create-course-btn" className="btn btn-primary" onClick={()=>setShowModal('create')}>+ New Course</button>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-stat"><div className="label">Total Courses</div><div className="value">{courses.length}</div></div>
        <div className="dashboard-stat"><div className="label">Platform</div><div className="value" style={{fontSize:'1.2rem'}}>Azure AKS</div></div>
        <div className="dashboard-stat"><div className="label">Storage</div><div className="value" style={{fontSize:'1.2rem'}}>Blob + CDN</div></div>
      </div>
      {loading ? <div className="spinner-overlay"><div className="spinner"/></div> : courses.length===0 ?
        <div className="empty-state"><div className="icon">📝</div><h3>No courses yet</h3></div> :
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {courses.map(c=>(
            <div key={c.id} className="card" style={{display:'flex',alignItems:'center',padding:'20px',gap:'16px',flexWrap:'wrap'}}>
              <div style={{width:'80px',height:'56px',borderRadius:'var(--radius-sm)',overflow:'hidden',flexShrink:0,background:'linear-gradient(135deg,#1e1b4b,#312e81)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={()=>uploadThumb(c.id)} title="Upload thumbnail">
                {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:'1.4rem'}}>📷</span>}
              </div>
              <div style={{flex:1,minWidth:'200px'}}><div style={{fontWeight:700,marginBottom:'4px'}}>{c.title}</div><div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{c.description}</div></div>
              <div style={{display:'flex',gap:'8px'}}>
                <button className="btn btn-secondary btn-sm" onClick={()=>{setSelectedCourseId(c.id);setShowModal('upload');}}>📹 Add Video</button>
                <button className="btn btn-danger btn-sm" onClick={()=>deleteCourse(c.id)}>🗑 Delete</button>
              </div>
            </div>))}
        </div>}
      {showModal==='create' && <div className="modal-overlay" onClick={()=>setShowModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <h2 className="modal-title">Create New Course</h2>
        <form onSubmit={createCourse}>
          <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={newTitle} onChange={e=>setNewTitle(e.target.value)} required/></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={newDesc} onChange={e=>setNewDesc(e.target.value)} required/></div>
          <div className="form-group"><label className="form-label">Tags (comma sep)</label><input className="form-input" value={newTags} onChange={e=>setNewTags(e.target.value)}/></div>
          <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}><button type="button" className="btn btn-secondary" onClick={()=>setShowModal(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?'Creating...':'Create'}</button></div>
        </form></div></div>}
      {showModal==='upload' && <div className="modal-overlay" onClick={()=>setShowModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <h2 className="modal-title">Upload Video</h2>
        <form onSubmit={uploadVideo}>
          <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={vidTitle} onChange={e=>setVidTitle(e.target.value)} required/></div>
          <div className="form-group"><label className="form-label">Duration (sec)</label><input className="form-input" type="number" value={vidDur} onChange={e=>setVidDur(e.target.value)}/></div>
          <div className="form-group"><label className="form-label">File</label><input className="form-input" type="file" accept="video/*" onChange={e=>setUploadFile(e.target.files[0])} required/></div>
          <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}><button type="button" className="btn btn-secondary" onClick={()=>setShowModal(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?'Uploading...':'Upload'}</button></div>
        </form></div></div>}
    </div></div>
  );
}
