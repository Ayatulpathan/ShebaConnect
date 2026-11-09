import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from '../../controllers/auth.controller.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../validators/auth.validator.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', validateBody(refreshTokenSchema), refresh);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);

export default router;
