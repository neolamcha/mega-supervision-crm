import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'mega-supervision-jwt-secret-2026',
  expiration: process.env.JWT_EXPIRATION || '24h',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
