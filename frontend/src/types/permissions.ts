export const PERMISSIONS = {
  FILES_UPLOAD: 'files:upload',
  FILES_DELETE: 'files:delete',
  FILES_DELETE_ANY: 'files:delete_any',
  FILES_RENAME: 'files:rename',
  FILES_VIEW_OWN: 'files:view_own',
  FILES_BROWSE: 'files:browse',
  FILES_DOWNLOAD: 'files:download',
  FILES_VIEW: 'files:view',
  FILES_LIST_ALL: 'files:list_all',

  USERS_LIST: 'users:list',
  USERS_MANAGE: 'users:manage',
  USERS_DELETE: 'users:delete',

  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_APPROVE: 'payments:approve',
  PAYMENTS_REQUEST: 'payments:request',

  ADS_MANAGE: 'ads:manage',
  ADS_VIEW_STATS: 'ads:view_stats',

  PRICING_MANAGE: 'pricing:manage',
  PRICING_VIEW: 'pricing:view',

  STORAGE_VIEW: 'storage:view',
  PROFILE_VIEW: 'profile:view',
  DASHBOARD_ACCESS: 'dashboard:access',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS) as Permission[],

  UPLOADER: [
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DELETE,
    PERMISSIONS.FILES_RENAME,
    PERMISSIONS.FILES_VIEW_OWN,
    PERMISSIONS.FILES_BROWSE,
    PERMISSIONS.FILES_VIEW,
    PERMISSIONS.PRICING_VIEW,
    PERMISSIONS.PAYMENTS_REQUEST,
    PERMISSIONS.STORAGE_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.DASHBOARD_ACCESS,
  ],

  DOWNLOADER: [
    PERMISSIONS.FILES_BROWSE,
    PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.FILES_VIEW,
    PERMISSIONS.PRICING_VIEW,
    PERMISSIONS.PROFILE_VIEW,
  ],
};

export function hasPermission(userType: string | undefined, permission: Permission): boolean {
  if (!userType) return false;
  const perms = RolePermissions[userType];
  return perms?.includes(permission) ?? false;
}

export function hasAnyPermission(userType: string | undefined, ...permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(userType, p));
}
