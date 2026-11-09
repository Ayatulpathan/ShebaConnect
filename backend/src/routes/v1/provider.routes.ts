import { Router } from 'express';
import {
  addOrUpdateListing,
  getMyListings,
  searchProviders,
  getProviderProfile,
} from '../../controllers/provider.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createProviderListingSchema } from '../../validators/marketplace.validator.js';

const router = Router();

// Public discovery routes
router.get('/', searchProviders);
router.get('/profile/:id', getProviderProfile);

// Provider listing management (Individual Providers & Company Owners)
router.get(
  '/listings/me',
  authenticate,
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER'),
  getMyListings
);

router.post(
  '/listings',
  authenticate,
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER'),
  validateBody(createProviderListingSchema),
  addOrUpdateListing
);

export default router;
