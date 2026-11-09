import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

const startServer = async () => {
  try {
    const app = createApp();
    const server = http.createServer(app);

    // Initialize Socket.IO with CORS
    const io = new SocketIOServer(server, {
      cors: {
        origin: [env.CLIENT_URL, 'http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    // Basic socket connection listener for Phase 1
    io.on('connection', (socket) => {
      logger.debug({ socketId: socket.id }, 'Socket client connected');

      socket.on('disconnect', (reason) => {
        logger.debug({ socketId: socket.id, reason }, 'Socket client disconnected');
      });
    });

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
