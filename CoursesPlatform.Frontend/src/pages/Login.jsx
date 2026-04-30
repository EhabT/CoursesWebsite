import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Login — simple login page. In production, this would use MSAL.js with Microsoft Entra External ID.
 * For now, stores a mock token and role in localStorage.
 */
export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('STUDENT');
  const currentRole = localStorage.getItem('userRole');

  function handleLogin() {
    // In production: use MSAL.js to get a real JWT from Entra External ID
    // For demo: store role in localStorage
    localStorage.setItem('userRole', role);
    localStorage.setItem('accessToken', 'demo-token');
    alert(`Logged in as ${role}`);
    navigate(role === 'INSTRUCTOR' ? '/dashboard' : '/');
  }

  function handleLogout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    alert('Logged out');
    navigate('/');
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '440px' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '40px', marginTop: '40px',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '32px', fontSize: '0.9rem' }}>
            Sign in with Microsoft Entra External ID
          </p>

          {currentRole && (
            <div style={{
              padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem', color: '#a7f3d0',
            }}>
              ✅ Currently logged in as <strong>{currentRole}</strong>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Role</label>
            <select id="role-select" className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="STUDENT">🎓 Student</option>
              <option value="INSTRUCTOR">👨‍🏫 Instructor</option>
            </select>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            In production, this uses MSAL.js to authenticate via Microsoft Entra External ID 
            with custom roles (INSTRUCTOR / STUDENT) assigned per user.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button id="login-btn" className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleLogin}>
              🔐 Sign In as {role}
            </button>
            {currentRole && (
              <button id="logout-btn" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
