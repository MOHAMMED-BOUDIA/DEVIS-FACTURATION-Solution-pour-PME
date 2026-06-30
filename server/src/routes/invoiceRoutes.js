import express from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  restoreInvoice,
  addPayment,
  getInvoicePDF,
  sendInvoice,
  markInvoicePaid,
  remindInvoice,
} from '../controllers/invoiceController.js';

import { requireAuth, requireRole, enforceCompanyScope, enforceOwnerScope } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(enforceCompanyScope);
router.use(enforceOwnerScope);

router.get('/:id/pdf', getInvoicePDF);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.post('/:id/restore', requireRole('admin'), restoreInvoice);

router.post('/:id/send', sendInvoice);
router.post('/:id/mark-paid', markInvoicePaid);
router.post('/:id/remind', remindInvoice);
router.post('/:id/payments', addPayment);

export default router;
