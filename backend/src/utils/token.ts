import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../constants/roles.js';

export interface TokenPayload {
  sub: string; // User ID
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string; // Unique JWT ID to guarantee rotation uniqueness
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
}

export const generateTokens = (payload: TokenPayload): GeneratedTokens => {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshPayload: RefreshTokenPayload = {
    ...payload,
    jti: crypto.randomUUID(),
  };

  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

/**
 * SHA-256 hash helper for storing rotated refresh tokens and password reset tokens in MongoDB
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generates a random crypto token (e.g. for password resets)
 */
export const generateRandomToken = (): { raw: string; hashed: string } => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = hashToken(raw);
  return { raw, hashed };
};
