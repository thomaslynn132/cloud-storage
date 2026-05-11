export const Permissions = {
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

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: Object.values(Permissions),

  UPLOADER: [
    Permissions.FILES_UPLOAD,
    Permissions.FILES_DELETE,
    Permissions.FILES_RENAME,
    Permissions.FILES_VIEW_OWN,
    Permissions.FILES_BROWSE,
    Permissions.FILES_VIEW,
    Permissions.PRICING_VIEW,
    Permissions.PAYMENTS_REQUEST,
    Permissions.STORAGE_VIEW,
    Permissions.PROFILE_VIEW,
    Permissions.DASHBOARD_ACCESS,
  ],

  DOWNLOADER: [
    Permissions.FILES_BROWSE,
    Permissions.FILES_DOWNLOAD,
    Permissions.FILES_VIEW,
    Permissions.PRICING_VIEW,
    Permissions.PROFILE_VIEW,
  ],
};
