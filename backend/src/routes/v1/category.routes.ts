import { Router } from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../controllers/category.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../../validators/marketplace.validator.js';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:idOrSlug', getCategory);

// Protected Admin routes
router.post(
  '/',
  authenticate,
  requireRoles('ADMIN'),
  validateBody(createCategorySchema),
  createCategory
);

router.patch(
  '/:id',
  authenticate,
  requireRoles('ADMIN'),
  validateBody(updateCategorySchema),
  updateCategory
);

router.delete('/:id', authenticate, requireRoles('ADMIN'), deleteCategory);

export default router;
