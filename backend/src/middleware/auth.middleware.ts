import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw AppError.unauthorized('Authentication required. Please log in.', 'AUTH_TOKEN_MISSING');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'TokenExpiredError') {
        throw AppError.unauthorized('Access token expired. Please refresh your session.', 'TOKEN_EXPIRED');
      }
      throw AppError.unauthorized('Invalid access token.', 'TOKEN_INVALID');
    }

    // Verify user still exists and is not suspended
    const user = await User.findById(payload.sub).select('status role email');
    if (!user) {
      throw AppError.unauthorized('User associated with this token no longer exists.', 'USER_NOT_FOUND');
    }

    if (user.status === 'SUSPENDED') {
      throw AppError.forbidden('Your account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};
