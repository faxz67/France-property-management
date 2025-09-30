import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminManagement from './pages/AdminManagement.jsx';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  
  // Debug logging
  console.log('ProtectedRoute - Token:', token ? 'exists' : 'missing');
  console.log('ProtectedRoute - User raw:', userRaw);
  
  // Safe JSON parsing
  let user = null;
  try {
    if (userRaw && userRaw !== 'undefined' && userRaw !== 'null') {
      user = JSON.parse(userRaw);
      console.log('ProtectedRoute - Parsed user:', user);
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  
  if (!token || !user) {
    console.log('ProtectedRoute - Redirecting to login. Token:', !!token, 'User:', !!user);
    return <Navigate to="/" replace />;
  }
  
  console.log('ProtectedRoute - Access granted');
  return children;
}

function SuperRoute({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  
  // Safe JSON parsing
  let user = null;
  try {
    if (userRaw && userRaw !== 'undefined' && userRaw !== 'null') {
      user = JSON.parse(userRaw);
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  
  // Check for SUPER_ADMIN role (matching backend response)
  if (!token || !user || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-management"
          element={
            <SuperRoute>
              <AdminManagement />
            </SuperRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;