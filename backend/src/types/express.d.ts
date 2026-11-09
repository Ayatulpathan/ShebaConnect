import type { UserRole } from '../constants/roles.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        status: string;
      };
    }
  }
}

export {};
