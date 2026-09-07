import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAvailableSession, getCurrentSession, redirectPathForUser, setActiveRole } from '../utils/session';
import api from '../api/axios';
import {
  PERMISSION_UPDATED_EVENT,
  canAccessModule,
  readCachedPermissions,
  writeCachedPermissions,
} from '../utils/modulePermissions';

const ProtectedRoute = ({ children, allowedRoles, module }) => {
  const current = allowedRoles ? getAvailableSession(allowedRoles) : getCurrentSession();
  const user = current?.session?.user || {};
  const permissionUser = useMemo(() => ({ id: user.id, role: user.role }), [user.id, user.role]);
  const [moduleAllowed, setModuleAllowed] = useState(() => {
    if (!module || user.role === 'ADMIN') return true;
    const cached = readCachedPermissions(permissionUser);
    return cached ? canAccessModule(permissionUser, cached, module) : null;
  });

  useEffect(() => {
    let isMounted = true;

    const checkModuleAccess = async () => {
      if (!current?.session?.access || !module || user.role === 'ADMIN') {
        if (isMounted) setModuleAllowed(true);
        return;
      }

      const cached = readCachedPermissions(permissionUser);
      if (cached && isMounted) setModuleAllowed(canAccessModule(permissionUser, cached, module));

      try {
        const response = await api.get('user-module-permissions/mine/');
        const permissions = response.data || [];
        writeCachedPermissions(permissionUser, permissions);
        if (isMounted) setModuleAllowed(canAccessModule(permissionUser, permissions, module));
      } catch (err) {
        if (isMounted && !cached) setModuleAllowed(true);
      }
    };

    checkModuleAccess();
    const intervalId = window.setInterval(checkModuleAccess, 30000);
    const handleVisibilityChange = () => {
      if (!document.hidden) checkModuleAccess();
    };
    const handlePermissionUpdate = (event) => {
      if (event.key === PERMISSION_UPDATED_EVENT) checkModuleAccess();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkModuleAccess);
    window.addEventListener('storage', handlePermissionUpdate);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkModuleAccess);
      window.removeEventListener('storage', handlePermissionUpdate);
    };
  }, [current?.session?.access, module, permissionUser, user.role]);

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

  if (moduleAllowed === null) return null;
  if (!moduleAllowed) return <Navigate to={redirectPathForUser(user)} replace />;

  return children;
};

export default ProtectedRoute;
