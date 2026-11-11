import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await AuthService.register(req.body);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await AuthService.login(req.body);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { idToken, role } = req.body;
    const { user, tokens } = await AuthService.loginWithGoogle(idToken, role);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token must be provided via cookie or request body',
        },
      });
      return;
    }

    const tokens = await AuthService.refresh(token);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (userId) {
      await AuthService.logout(userId, token);
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AuthService.forgotPassword(req.body.identifier);

    res.status(200).json({
      success: true,
      message:
        'If an account with that identifier exists, password reset instructions have been generated.',
      data:
        env.NODE_ENV !== 'production'
          ? {
              resetToken: result.resetToken,
              expiresAt: result.expiresAt,
              notice:
                'Zero-cost notice: resetToken exposed in response during development/testing without paid email/SMS.',
            }
          : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await AuthService.resetPassword(req.body.token, req.body.newPassword);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await AuthService.getMe(req.user!.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
