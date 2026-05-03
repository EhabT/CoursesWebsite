import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import InstructorDashboard from './pages/InstructorDashboard';
import Login from './pages/Login';
import { authApi } from './services/api';

export default function App() {
  const isAuthenticated = useIsAuthenticated();
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState(null);

  // Fetch the role from the backend after login — roles live in the access token,
  // not the ID token, so we can't read them from idTokenClaims on the frontend.
  useEffect(() => {
    if (isAuthenticated) {
      setRoleLoading(true);
      setRoleError(null);
      authApi.getMe()
        .then(data => setRole(data.role))
        .catch(error => {
          console.error('Failed to load current user role:', error);
          setRole(null);
          setRoleError('Could not load your account role. Please sign out and sign in again.');
        })
        .finally(() => setRoleLoading(false));
    } else {
      setRole(null);
      setRoleError(null);
      setRoleLoading(false);
    }
  }, [isAuthenticated]);

  // Route Guard Component
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roleLoading) return <div className="page"><div className="container">Loading your account...</div></div>;
    if (roleError) return <Navigate to="/login" replace />;
    if (role !== requiredRole) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <Router>
      <div className="app-layout">
        {/* Navigation */}
        <nav className="navbar">
          <div className="navbar-inner">
            <NavLink to="/" className="navbar-brand">
              <div className="brand-icon">🎓</div>
              Courses Platform
            </NavLink>
            <div className="navbar-links">
              <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} end>
                Home
              </NavLink>
              {role === 'INSTRUCTOR' && (
                <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  Dashboard
                </NavLink>
              )}
              <NavLink to="/login" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                {roleLoading ? 'Loading...' : role ? `👤 ${role}` : 'Login'}
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="INSTRUCTOR">
              <InstructorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login role={role} roleLoading={roleLoading} roleError={roleError} />} />
        </Routes>
      </div>
    </Router>
  );
}
