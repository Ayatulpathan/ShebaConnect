import { Router } from 'express';
import {
  createCompany,
  getMyCompany,
  updateCompany,
  addMember,
  getMembers,
  removeMember,
} from '../../controllers/companyOperations.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addOrganizationMemberSchema,
} from '../../validators/operations.validator.js';

const router = Router();

// All company routes require authentication
router.use(authenticate);

// Company registration & profile
router.post(
  '/',
  requireRoles('COMPANY_OWNER'),
  validateBody(createOrganizationSchema),
  createCompany
);

router.get(
  '/my-company',
  requireRoles('COMPANY_OWNER', 'COMPANY_STAFF', 'TECHNICIAN'),
  getMyCompany
);

router.patch(
  '/:id',
  requireRoles('COMPANY_OWNER'),
  validateBody(updateOrganizationSchema),
  updateCompany
);

// Staff and Technician Management
router.post(
  '/:id/members',
  requireRoles('COMPANY_OWNER'),
  validateBody(addOrganizationMemberSchema),
  addMember
);

router.get(
  '/:id/members',
  requireRoles('COMPANY_OWNER', 'COMPANY_STAFF'),
  getMembers
);

router.delete(
  '/:id/members/:memberId',
  requireRoles('COMPANY_OWNER'),
  removeMember
);

export default router;
