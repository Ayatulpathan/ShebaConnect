import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import type { UserRole } from '../constants/roles.js';

/**
 * Restricts endpoint access to specific user roles
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
};

/**
 * Ensures a user cannot access or modify another user's private resource by altering ID in URL
 * (Admins and Support Agents with appropriate permissions can bypass)
 */
export const requireOwnershipOrAdmin = (paramName: string = 'id') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    const targetId = req.params[paramName];
    const isOwner = req.user.id === targetId;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPPORT_AGENT';

    if (!isOwner && !isAdmin) {
      return next(
        AppError.forbidden(
          'You are not authorized to access or modify this user profile.',
          'FORBIDDEN_OWNERSHIP'
        )
      );
    }

    next();
  };
};
