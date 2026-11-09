import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // 1. Known AppError (Operational)
  if (err instanceof AppError) {
    logger.warn(
      {
        path: req.path,
        method: req.method,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        message: err.message,
      },
      'Operational error handled'
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    logger.warn(
      {
        path: req.path,
        method: req.method,
        errors: formattedErrors,
      },
      'Validation error handled'
    );

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or parameters',
        details: formattedErrors,
      },
    });
    return;
  }

  // 3. Mongoose Duplicate Key Error (Code 11000)
  if ((err as { code?: number }).code === 11000) {
    const fieldMatch = (err as { message?: string }).message?.match(/index: (.+)_1/);
    const fieldName = fieldMatch ? fieldMatch[1] : 'Field';

    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY_ERROR',
        message: `${fieldName} already exists in the system`,
      },
    });
    return;
  }

  // 4. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID_FORMAT',
        message: 'Invalid identifier format provided in request parameter',
      },
    });
    return;
  }

  // 5. Unhandled / Unexpected Server Errors
  logger.error(
    {
      path: req.path,
      method: req.method,
      error: err.message,
      stack: err.stack,
    },
    '🔥 Unhandled server error'
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : err.message,
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
};
