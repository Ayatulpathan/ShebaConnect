import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../../controllers/user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  updateProfileSchema,
  addressSchema,
  updateAddressSchema,
} from '../../validators/auth.validator.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', validateBody(updateProfileSchema), updateProfile);

router.get('/addresses', getAddresses);
router.post('/addresses', validateBody(addressSchema), addAddress);
router.patch('/addresses/:id', validateBody(updateAddressSchema), updateAddress);
router.delete('/addresses/:id', deleteAddress);

export default router;
