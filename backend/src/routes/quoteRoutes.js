import express from 'express';
import {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  restoreQuote,
  convertToInvoice,
  getQuotePDF,
  sendQuote,
  markQuoteAccepted,
  markQuoteRejected,
} from '../controllers/quoteController.js';

import { requireAuth, requireRole, enforceCompanyScope, enforceOwnerScope } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(enforceCompanyScope);
router.use(enforceOwnerScope);

router.get('/:id/pdf', getQuotePDF);

router.route('/')
  .get(getQuotes)
  .post(createQuote);

router.route('/:id')
  .get(getQuote)
  .put(updateQuote)
  .delete(deleteQuote);

router.post('/:id/restore', requireRole('admin'), restoreQuote);

router.post('/:id/send', sendQuote);
router.post('/:id/accept', markQuoteAccepted);
router.post('/:id/reject', markQuoteRejected);
router.post('/:id/convert', convertToInvoice);

export default router;
