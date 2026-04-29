import express from 'express';
import { requireAuth, requireAdmin, enforceCompanyScope } from '../middleware/auth.js';
import {
  getCompanyUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserSummary,
  getUserStats,
  getUserData,
  getUserAuditLogs,
  getUserClients,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(requireAuth);
router.use(enforceCompanyScope);
router.use(requireAdmin);

router.get('/users', getCompanyUsers);
router.post('/users', createUser);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.get('/users/:userId/clients', getUserClients);
router.get('/users/:userId/data', getUserData);
router.get('/users/:userId/summary', getUserSummary);
router.get('/users/:userId/stats', getUserStats);
router.get('/users/:userId/audit-logs', getUserAuditLogs);

// Backward-compatible aliases
router.get('/users/:id/summary', getUserSummary);
router.get('/users/:id/stats', getUserStats);
router.get('/users/:id/data', getUserData);
router.get('/users/:id/audit-logs', getUserAuditLogs);

export default router;
