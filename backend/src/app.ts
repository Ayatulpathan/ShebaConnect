import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import v1Routes from './routes/v1/index.js';
import { getHealthPing } from './controllers/health.controller.js';

export const createApp = (): express.Application => {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Controlled CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
        if (
          allowedOrigins.includes(origin) ||
          env.NODE_ENV === 'development' ||
          origin.endsWith('.pages.dev') ||
          origin.endsWith('.github.io') ||
          origin.endsWith('.onrender.com') ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy blocked this request origin'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Body & Cookie Parsing (Payload size strictly limited for zero-cost resource safety)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  // 4. HTTP Request Logger (Pino)
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === '/health' || req.url === '/api/v1/health/ping',
        },
      })
    );
  }

  // 5. Global Rate Limiter
  app.use(apiRateLimiter);

  // 6. Direct Root Health Endpoint (Used by Render, Cloudflare, Uptime checks)
  app.get('/health', getHealthPing);

  // 7. API v1 Routes
  app.use(env.API_PREFIX, v1Routes);

  // 8. 404 & Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
