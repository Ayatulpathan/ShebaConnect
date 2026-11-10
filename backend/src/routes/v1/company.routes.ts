import { Router } from 'express';
import {
  createCompany,
  getMyCompany,
  updateCompany,
  addMember,
  getMembers,
  removeMember,
  updateMember,
  assignTechnician,
  getTechnicianJobs,
  getCompanyBookings,
  getCompanyMetrics,
} from '../../controllers/companyOperations.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addOrganizationMemberSchema,
  assignTechnicianSchema,
  updateOrganizationMemberSchema,
} from '../../validators/operations.validator.js';

const router = Router();

// All company routes require authentication
router.use(authenticate);

// Dedicated Technician Job list (must precede parameterized routes)
router.get(
  '/technicians/my-jobs',
  requireRoles('TECHNICIAN'),
  getTechnicianJobs
);

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

router.patch(
  '/:id/members/:memberId',
  requireRoles('COMPANY_OWNER'),
  validateBody(updateOrganizationMemberSchema),
  updateMember
);

router.delete(
  '/:id/members/:memberId',
  requireRoles('COMPANY_OWNER'),
  removeMember
);

// Company Bookings & Technician Dispatch
router.post(
  '/:id/bookings/:bookingId/assign-technician',
  requireRoles('COMPANY_OWNER', 'COMPANY_STAFF'),
  validateBody(assignTechnicianSchema),
  assignTechnician
);

router.get(
  '/:id/bookings',
  requireRoles('COMPANY_OWNER', 'COMPANY_STAFF'),
  getCompanyBookings
);

// Company Performance Metrics & Technician Leaderboard
router.get(
  '/:id/metrics',
  requireRoles('COMPANY_OWNER', 'COMPANY_STAFF'),
  getCompanyMetrics
);

export default router;
