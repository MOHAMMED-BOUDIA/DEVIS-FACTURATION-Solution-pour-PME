import express from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  restoreClient,
} from '../controllers/clientController.js';

import { requireAuth, requireRole, enforceCompanyScope, enforceOwnerScope } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(enforceCompanyScope);
router.use(enforceOwnerScope);

router.route('/')
  .get(getClients)
  .post(createClient);

router.route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

router.post('/:id/restore', requireRole('admin'), restoreClient);

export default router;
