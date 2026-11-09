import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

interface DbConnectionStatus {
  isConnected: boolean;
  state: string;
  host?: string;
  name?: string;
}

const connectionStates: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    mongoose.set('strictQuery', true);

    const connection = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10, // Safeguard for MongoDB Atlas Free Tier (100 connection cap)
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: env.NODE_ENV !== 'production',
    });

    logger.info(
      {
        host: connection.connection.host,
        db: connection.connection.name,
      },
      '✅ MongoDB connected successfully'
    );

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB runtime connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB connection lost. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected successfully');
    });

    return connection;
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to MongoDB');
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed gracefully');
  }
};

export const getDbStatus = (): DbConnectionStatus => {
  const readyState = mongoose.connection.readyState;
  return {
    isConnected: readyState === 1,
    state: connectionStates[readyState] ?? 'unknown',
    host: mongoose.connection.host || undefined,
    name: mongoose.connection.name || undefined,
  };
};
