import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

export default function Login() {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loginError, setLoginError] = useState(null);
  
  const email = isAuthenticated && accounts.length > 0 ? accounts[0].username : '';
  const role = isAuthenticated && accounts.length > 0 
    ? (accounts[0].idTokenClaims?.roles?.[0] || (email.toLowerCase() === 'etarek1310@gmail.com' ? 'INSTRUCTOR' : 'STUDENT'))
    : null;

  async function handleLogin() {
    try {
      setLoginError(null);
      await instance.loginPopup(loginRequest);
      navigate('/');
    } catch (error) {
      console.error(error);
      setLoginError(error.message || 'Unknown login error');
    }
  }

  async function handleLogout() {
    try {
      await instance.logoutPopup();
      navigate('/');
    } catch (error) {
      console.error(error);
    }
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

          {isAuthenticated ? (
            <div style={{
              padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem', color: '#a7f3d0',
            }}>
              ✅ Logged in as <strong>{accounts[0].name}</strong> (Role: {role})
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
              You are currently signed out.
            </p>
          )}

          {loginError && (
            <div style={{
              padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem', color: '#fca5a5', wordBreak: 'break-word'
            }}>
              ❌ <strong>Login Error:</strong> {loginError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isAuthenticated ? (
              <button id="login-btn" className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleLogin}>
                🔐 Sign In with Microsoft
              </button>
            ) : (
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
