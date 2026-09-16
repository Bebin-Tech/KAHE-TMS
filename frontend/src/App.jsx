import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const DeanDashboard = lazy(() => import('./pages/DeanDashboard.jsx'));
const HODDashboard = lazy(() => import('./pages/HODDashboard.jsx'));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const UserManagement = lazy(() => import('./pages/UserManagement.jsx'));
const DepartmentManagement = lazy(() => import('./pages/DepartmentManagement.jsx'));
const Tasks = lazy(() => import('./pages/Tasks.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const AcademicCalendar = lazy(() => import('./pages/AcademicCalendar.jsx'));
const Notes = lazy(() => import('./pages/Notes.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const CompleteModule = lazy(() => import('./pages/CompleteModule.jsx'));
const CompletedTasks = lazy(() => import('./pages/CompletedTasks.jsx'));
const ChangePassword = lazy(() => import('./pages/ChangePassword.jsx'));

const PageLoading = () => (
  <div
    role="status"
    aria-label="Loading page"
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      color: '#2563eb',
      fontFamily: 'inherit',
      fontWeight: 700,
      background: '#f5f8fc',
    }}
  >
    Loading...
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoading />}>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route
          element={(
            <ProtectedRoute>
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            </ProtectedRoute>
          )}
        >
        <Route
          path="/dean-dashboard"
          element={
            <ProtectedRoute allowedRoles={['DEAN']} module="dashboard">
              <DeanDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod-dashboard"
          element={
            <ProtectedRoute allowedRoles={['HOD']} module="dashboard">
              <HODDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']} module="dashboard">
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

        <Route
          path="/department-management"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DepartmentManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute module="tasks">
              <Tasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute module="reports">
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/academic-calendar"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DEAN', 'HOD']} module="academic_calendar">
              <AcademicCalendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notes"
          element={
            <ProtectedRoute module="notes">
              <Notes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-notes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Notes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute module="settings">
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/complete-module"
          element={
            <ProtectedRoute module="completed_tasks">
              <CompleteModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/completed-tasks"
          element={
            <ProtectedRoute module="completed_tasks">
              <CompletedTasks />
            </ProtectedRoute>
          }
        />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
