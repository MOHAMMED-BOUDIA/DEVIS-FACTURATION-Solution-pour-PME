import express from 'express';
import { createMeCompany, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMe);
router.post('/company', createMeCompany);

export default router;