import { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  submitVerification,
  getAvailability,
  updateAvailability,
} from '../../controllers/providerOperations.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  updateProviderProfileSchema,
  submitVerificationSchema,
  updateAvailabilitySchema,
} from '../../validators/operations.validator.js';

const router = Router();

// All operational provider routes require authentication
router.use(authenticate);

// Profile & verification
router.get(
  '/me',
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER'),
  getMyProfile
);

router.patch(
  '/me',
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER'),
  validateBody(updateProviderProfileSchema),
  updateMyProfile
);

router.post(
  '/verification',
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER'),
  validateBody(submitVerificationSchema),
  submitVerification
);

// Availability
router.get(
  '/availability',
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER', 'TECHNICIAN'),
  getAvailability
);

router.put(
  '/availability',
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER', 'TECHNICIAN'),
  validateBody(updateAvailabilitySchema),
  updateAvailability
);

export default router;
