import { Router } from 'express';
import { NotificationController } from '../../controllers/notification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', NotificationController.listNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.deleteNotification);

export const notificationRoutes = router;
