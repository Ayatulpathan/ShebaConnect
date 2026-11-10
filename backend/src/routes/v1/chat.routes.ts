import { Router } from 'express';
import { ChatController } from '../../controllers/chat.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

router.get('/bookings/:bookingId', ChatController.getMessages);
router.post('/bookings/:bookingId', ChatController.sendMessage);
router.patch('/bookings/:bookingId/read', ChatController.markRead);

export const chatRoutes = router;
