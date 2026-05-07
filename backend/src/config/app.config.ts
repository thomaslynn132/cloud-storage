export const appConfig = {
  port: parseInt(process.env.PORT || '3001'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@filehost.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  freeStorageLimit: 25 * 1024 * 1024 * 1024, // 25GB for free uploaders
  freeFileExpiryDays: 30,
  adGateDuration: 5000, // 5 seconds
  maxFreeDuration: 0, // 0 means no duration limit for free users
};
