import express from 'express';
import { getSummaryStats, getCompanyStats, getUserStats } from '../controllers/statsController.js';
import { requireAuth, requireAdmin, enforceCompanyScope } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(enforceCompanyScope);

router.get('/summary', getSummaryStats);
router.get('/company', requireAdmin, getCompanyStats);
router.get('/user/:userId', requireAdmin, getUserStats);

export default router;
