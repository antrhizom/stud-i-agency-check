import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import LearnerDashboard from './components/learner/LearnerDashboard';
import ExternalDashboard from './components/external/ExternalDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleBasedRedirect() {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) return <Navigate to="/login" replace />;

  switch (userData.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'learner':
      return <Navigate to="/learner" replace />;
    case 'external':
      return <Navigate to="/external" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleBasedRedirect />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/learner/*"
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <LearnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/external/*"
            element={
              <ProtectedRoute allowedRoles={['external']}>
                <ExternalDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
