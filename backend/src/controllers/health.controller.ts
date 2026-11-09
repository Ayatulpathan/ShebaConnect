import type { Request, Response } from 'express';
import { getDbStatus } from '../config/db.js';
import { env } from '../config/env.js';

export const getHealthPing = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'ShebaConnect API',
  });
};

export const getDetailedHealth = (_req: Request, res: Response): void => {
  const dbStatus = getDbStatus();
  const memoryUsage = process.memoryUsage();

  const isHealthy = dbStatus.isConnected || env.NODE_ENV === 'test';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: 'ShebaConnect API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    system: {
      memory: {
        heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      },
      nodeVersion: process.version,
    },
    zeroCostPolicy: {
      budget: '৳0 / $0',
      cloudR2Active: false,
      paidMapAPIsActive: false,
      paidPaymentGatewayActive: false,
    },
  });
};
