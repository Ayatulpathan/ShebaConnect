export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errorCode: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errorCode: string = 'BAD_REQUEST', details?: unknown): AppError {
    return new AppError(400, message, errorCode, details);
  }

  static unauthorized(message: string = 'Unauthorized access', errorCode: string = 'UNAUTHORIZED'): AppError {
    return new AppError(401, message, errorCode);
  }

  static forbidden(message: string = 'Forbidden action', errorCode: string = 'FORBIDDEN'): AppError {
    return new AppError(403, message, errorCode);
  }

  static notFound(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND'): AppError {
    return new AppError(404, message, errorCode);
  }

  static conflict(message: string, errorCode: string = 'CONFLICT'): AppError {
    return new AppError(409, message, errorCode);
  }

  static internal(message: string = 'An unexpected internal error occurred'): AppError {
    return new AppError(500, message, 'INTERNAL_SERVER_ERROR');
  }
}
