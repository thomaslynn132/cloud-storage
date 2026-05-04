export const appConfig = {
  port: parseInt(process.env.PORT || '3001'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@filehost.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  freeStorageLimit: 5 * 1024 * 1024 * 1024, // 5GB
  basicStorageLimit: 50 * 1024 * 1024 * 1024, // 50GB
  proStorageLimit: 500 * 1024 * 1024 * 1024, // 500GB
  freeFileExpiryDays: 30,
  adGateDuration: 5000, // 5 seconds
};
