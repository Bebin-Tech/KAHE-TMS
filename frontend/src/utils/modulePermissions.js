import api from '../api/axios';

const permissionCachePrefix = 'tms_module_permissions';
export const PERMISSION_UPDATED_EVENT = 'tms_permissions_updated';
const permissionCacheMaxAge = 60 * 1000;
const permissionRequests = new Map();

export const MODULE_BY_PATH = {
  '/admin-dashboard': 'dashboard',
  '/dean-dashboard': 'dashboard',
  '/hod-dashboard': 'dashboard',
  '/faculty-dashboard': 'dashboard',
  '/department-management': 'department_management',
  '/tasks': 'tasks',
  '/completed-tasks': 'completed_tasks',
  '/complete-module': 'completed_tasks',
  '/reports': 'reports',
  '/academic-calendar': 'academic_calendar',
  '/notes': 'notes',
  '/admin-notes': 'notes',
  '/user-management': 'user_management',
  '/settings': 'settings',
};

export const getPermissionCacheKey = (user) => (
  user?.id && user?.role ? `${permissionCachePrefix}:${user.id}:${user.role}` : ''
);

export const readCachedPermissions = (user) => {
  const key = getPermissionCacheKey(user);
  if (!key) return null;

  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : parsed.permissions || null;
  } catch (err) {
    return null;
  }
};

const readPermissionCacheEntry = (user) => {
  const key = getPermissionCacheKey(user);
  if (!key) return null;

  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed)
      ? { permissions: parsed, cachedAt: 0 }
      : parsed;
  } catch (err) {
    return null;
  }
};

export const writeCachedPermissions = (user, permissions) => {
  const key = getPermissionCacheKey(user);
  if (!key) return;
  sessionStorage.setItem(key, JSON.stringify({ permissions, cachedAt: Date.now() }));
};

export const clearCachedPermissions = (user) => {
  const key = getPermissionCacheKey(user);
  if (key) {
    permissionRequests.delete(key);
    sessionStorage.removeItem(key);
  }
};

export const loadModulePermissions = async (user, { force = false } = {}) => {
  if (!user?.id || user.role === 'ADMIN') return [];

  const key = getPermissionCacheKey(user);
  const cached = readPermissionCacheEntry(user);
  const cacheIsFresh = cached?.permissions
    && Date.now() - Number(cached.cachedAt || 0) < permissionCacheMaxAge;

  if (!force && cacheIsFresh) return cached.permissions;
  if (permissionRequests.has(key)) return permissionRequests.get(key);

  const request = api.get('user-module-permissions/mine/')
    .then((response) => {
      const permissions = response.data || [];
      writeCachedPermissions(user, permissions);
      return permissions;
    })
    .finally(() => permissionRequests.delete(key));

  permissionRequests.set(key, request);
  return request;
};

export const notifyPermissionChange = (userId) => {
  localStorage.setItem(PERMISSION_UPDATED_EVENT, JSON.stringify({
    userId: String(userId || ''),
    updatedAt: Date.now(),
  }));
};

export const getModuleForPath = (path) => MODULE_BY_PATH[path] || null;

export const canAccessModule = (user, permissions, module) => {
  if (!module || user?.role === 'ADMIN') return true;
  if (!Array.isArray(permissions) || permissions.length === 0) return true;

  const permission = permissions.find((row) => row.module === module);
  return !permission || Boolean(permission.can_access);
};
