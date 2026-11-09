import { Router } from 'express';
import {
  getServices,
  getService,
  searchServices,
  createService,
  updateService,
  deleteService,
} from '../../controllers/service.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';
import { validateBody, validateQuery } from '../../middleware/validate.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  searchServicesSchema,
} from '../../validators/marketplace.validator.js';

const router = Router();

// Public routes
router.get('/', getServices);
router.get('/search', validateQuery(searchServicesSchema), searchServices);
router.get('/:idOrSlug', getService);

// Protected Admin routes
router.post(
  '/',
  authenticate,
  requireRoles('ADMIN'),
  validateBody(createServiceSchema),
  createService
);

router.patch(
  '/:id',
  authenticate,
  requireRoles('ADMIN'),
  validateBody(updateServiceSchema),
  updateService
);

router.delete('/:id', authenticate, requireRoles('ADMIN'), deleteService);

export default router;
