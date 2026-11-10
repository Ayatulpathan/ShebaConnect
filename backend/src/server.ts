import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { SocketService } from './services/socket.service.js';

const startServer = async () => {
  try {
    const app = createApp();
    const server = http.createServer(app);

    // Initialize authenticated Socket.IO Service
    SocketService.init(server);

    // Connect to database (non-blocking for initial local tests if DB is down)
    try {
      await connectDatabase();
      const { seedInitialMarketplace } = await import('./config/seed.js');
      await seedInitialMarketplace();
    } catch (dbErr) {
      logger.warn(
        'Database connection could not be established at launch. Server continuing in degraded mode for development/testing.'
      );
    }

    server.listen(env.PORT, () => {
      logger.info(
        `🚀 ShebaConnect Backend Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
      logger.info(`🔗 Base API URL: ${env.APP_URL}${env.API_PREFIX}`);
      logger.info(`🩺 Health check: ${env.APP_URL}/health`);
    });

    // Graceful Shutdown Handlers
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        logger.info('Graceful shutdown completed. Exiting.');
        process.exit(0);
      });

      // Force exit if shutdown hangs beyond 10s
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error }, 'Fatal error starting backend server');
    process.exit(1);
  }
};

startServer();
