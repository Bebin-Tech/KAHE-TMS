const permissionCachePrefix = 'tms_module_permissions';
export const PERMISSION_UPDATED_EVENT = 'tms_permissions_updated';

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
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    return null;
  }
};

export const writeCachedPermissions = (user, permissions) => {
  const key = getPermissionCacheKey(user);
  if (!key) return;
  sessionStorage.setItem(key, JSON.stringify(permissions));
};

export const clearCachedPermissions = (user) => {
  const key = getPermissionCacheKey(user);
  if (key) sessionStorage.removeItem(key);
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
