import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import serviceRoutes from './service.routes.js';
import providerRoutes from './provider.routes.js';
import providerOperationsRoutes from './providerOperations.routes.js';
import companyRoutes from './company.routes.js';
import { bookingRoutes } from './booking.routes.js';
import { paymentRoutes } from './payment.routes.js';
import { notificationRoutes } from './notification.routes.js';
import { chatRoutes } from './chat.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/services', serviceRoutes);
router.use('/providers', providerRoutes);
router.use('/providers/operations', providerOperationsRoutes);
router.use('/companies', companyRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);

export default router;
