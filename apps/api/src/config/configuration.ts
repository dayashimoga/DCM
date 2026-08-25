export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/marketplace?schema=public',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-super-secure-jwt-secret-key-32-chars-minimum',
    expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-super-secure-jwt-refresh-secret-key-32-chars',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  platform: {
    commissionRate: parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.15'),
  },
});
