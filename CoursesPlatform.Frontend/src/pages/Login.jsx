import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

export default function Login({ role, roleLoading, roleError }) {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const account = accounts[0];
  const displayName = account?.name
    || account?.username
    || account?.idTokenClaims?.email
    || account?.idTokenClaims?.preferred_username
    || 'your account';

  async function handleLogin() {
    setLoginError(null);
    setLoading(true);
    try {
      // CIAM (External ID) works best with redirect, not popup
      await instance.loginRedirect(loginRequest);
      // Note: navigate('/') is handled by MSAL after redirect completes
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
    }
  }

  async function handleLogout() {
    try {
      await instance.logoutRedirect({
        account: accounts[0],
        postLogoutRedirectUri: window.location.origin + '/login',
      });
    } catch (error) {
      console.error('Logout error:', error);
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
              ✅ Signed in as <strong>{displayName}</strong>
              <div style={{ marginTop: '4px', fontSize: '0.78rem' }}>
                Role: <strong>{roleLoading ? 'Loading...' : role || 'Unavailable'}</strong>
              </div>
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
              ❌ <strong>Error:</strong> {loginError}
            </div>
          )}

          {roleError && (
            <div style={{
              padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem', color: '#fca5a5', wordBreak: 'break-word'
            }}>
              <strong>Account role error:</strong> {roleError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isAuthenticated ? (
              <button
                id="login-btn"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? '⏳ Signing in...' : '🔐 Sign In with Microsoft'}
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => navigate(role === 'INSTRUCTOR' ? '/dashboard' : '/')}
                  disabled={roleLoading || Boolean(roleError)}
                >
                  {role === 'INSTRUCTOR' ? '📊 Go to Dashboard' : '🏠 Go to Home'}
                </button>
                <button id="logout-btn" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
