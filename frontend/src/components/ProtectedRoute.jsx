import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAvailableSession, redirectPathForUser, setActiveRole } from '../utils/session';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const current = getAvailableSession(allowedRoles);
  const user = current?.session?.user || {};

  if (!current?.session?.access) {
    return <Navigate to="/login" replace />;
  }
  setActiveRole(current.role);

  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they try to access unauthorized role page
    return <Navigate to={redirectPathForUser(user)} replace />;
  }

  return children;
};

export default ProtectedRoute;
