import { Router } from 'express';
import { getDetailedHealth, getHealthPing } from '../../controllers/health.controller.js';

const router = Router();

router.get('/ping', getHealthPing);
router.get('/', getDetailedHealth);

export default router;
