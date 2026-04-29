import express from 'express';
import {
  getCompany,
  updateCompany,
} from '../controllers/companyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes Protected

router.route('/')
  .get(getCompany)
  .put(authorize('admin'), updateCompany); // Only Admin can update company info

export default router;
