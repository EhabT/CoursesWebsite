import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import InstructorDashboard from './pages/InstructorDashboard';
import Login from './pages/Login';

export default function App() {
  const role = localStorage.getItem('userRole');

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
                {role ? `👤 ${role}` : 'Login'}
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/dashboard" element={<InstructorDashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}
