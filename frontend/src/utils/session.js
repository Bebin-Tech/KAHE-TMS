const SESSION_PREFIX = 'tms_session';
const ACTIVE_ROLE_KEY = 'tms_active_role';
const ROUTE_ROLE_PREFIX = 'tms_route_role';
const LEGACY_KEYS = ['access_token', 'refresh_token', 'user'];

export const ROLE_ROUTES = {
  ADMIN: '/admin-dashboard',
  DEAN: '/dean-dashboard',
  HOD: '/hod-dashboard',
  FACULTY: '/faculty-dashboard',
};

const ROUTE_ROLES = {
  '/admin-dashboard': 'ADMIN',
  '/user-management': 'ADMIN',
  '/department-management': 'ADMIN',
  '/dean-dashboard': 'DEAN',
  '/hod-dashboard': 'HOD',
  '/faculty-dashboard': 'FACULTY',
};

const getSessionKey = (role) => `${SESSION_PREFIX}:${role}`;
const getRouteRoleKey = (path) => `${ROUTE_ROLE_PREFIX}:${path}`;

const getLegacySession = (role) => {
  try {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!access || !user?.role || user.role !== role) return null;
    return { access, refresh, user };
  } catch (error) {
    console.error('Unable to read legacy session', error);
    return null;
  }
};

export const getRoleFromPath = (path = window.location.pathname) => ROUTE_ROLES[path] || null;

export const setRouteRole = (path, role) => {
  if (path && role) sessionStorage.setItem(getRouteRoleKey(path), role);
};

export const getRouteRole = (path = window.location.pathname) => {
  const fixedRole = getRoleFromPath(path);
  if (fixedRole) return fixedRole;
  return sessionStorage.getItem(getRouteRoleKey(path));
};

export const getStoredSession = (role) => {
  if (!role) return null;

  try {
    const session = JSON.parse(localStorage.getItem(getSessionKey(role)) || 'null');
    if (session) return session;

    const legacySession = getLegacySession(role);
    if (legacySession) {
      localStorage.setItem(getSessionKey(role), JSON.stringify(legacySession));
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    }
    return legacySession;
  } catch (error) {
    console.error('Unable to read stored session', error);
    return null;
  }
};

export const setActiveRole = (role) => {
  if (role) sessionStorage.setItem(ACTIVE_ROLE_KEY, role);
};

export const getActiveRole = () => sessionStorage.getItem(ACTIVE_ROLE_KEY) || getRouteRole();

export const getAvailableSession = (roles) => {
  const roleList = roles || Object.keys(ROLE_ROUTES);
  const activeRole = getActiveRole();

  if (activeRole && roleList.includes(activeRole)) {
    const activeSession = getStoredSession(activeRole);
    if (activeSession?.access) return { role: activeRole, session: activeSession };
  }

  for (const role of roleList) {
    const session = getStoredSession(role);
    if (session?.access) return { role, session };
  }

  return null;
};

export const getCurrentSession = () => {
  const pathRole = getRouteRole();
  if (pathRole) {
    const pathSession = getStoredSession(pathRole);
    if (pathSession?.access) {
      setActiveRole(pathRole);
      return { role: pathRole, session: pathSession };
    }
  }

  return getAvailableSession();
};

export const saveRoleSession = ({ access, refresh, user }) => {
  if (!user?.role) return;

  const session = { access, refresh, user };
  localStorage.setItem(getSessionKey(user.role), JSON.stringify(session));
  setActiveRole(user.role);
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const updateRoleUser = (role, updater) => {
  const session = getStoredSession(role);
  if (!session) return null;

  const nextUser = typeof updater === 'function' ? updater(session.user || {}) : updater;
  const nextSession = { ...session, user: nextUser };
  localStorage.setItem(getSessionKey(role), JSON.stringify(nextSession));
  return nextUser;
};

export const updateRoleAccessToken = (role, access) => {
  const session = getStoredSession(role);
  if (!session) return;

  localStorage.setItem(getSessionKey(role), JSON.stringify({ ...session, access }));
};

export const clearRoleSession = (role) => {
  if (!role) return;

  localStorage.removeItem(getSessionKey(role));
  if (getActiveRole() === role) sessionStorage.removeItem(ACTIVE_ROLE_KEY);
};

export const redirectPathForUser = (user) => {
  if (user?.must_change_password) return '/change-password';
  return ROLE_ROUTES[user?.role] || '/login';
};
