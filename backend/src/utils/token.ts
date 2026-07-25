import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
  const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  return jwt.sign({ userId }, secret, { expiresIn: expiry as any });
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  const expiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  return jwt.sign({ userId }, secret, { expiresIn: expiry as any });
};

export const verifyAccessToken = (token: string): { userId: string } | null => {
  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
    return jwt.verify(token, secret) as { userId: string };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
    return jwt.verify(token, secret) as { userId: string };
  } catch {
    return null;
  }
};
