module.exports = {
  secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
};
