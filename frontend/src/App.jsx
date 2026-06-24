import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DeanDashboard from './pages/DeanDashboard.jsx';
import HODDashboard from './pages/HODDashboard.jsx';
import FacultyDashboard from './pages/FacultyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserManagement from './pages/UserManagement.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route
          path="/dean-dashboard"
          element={
            <ProtectedRoute allowedRoles={['DEAN']}>
              <DeanDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod-dashboard"
          element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HODDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-management"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
