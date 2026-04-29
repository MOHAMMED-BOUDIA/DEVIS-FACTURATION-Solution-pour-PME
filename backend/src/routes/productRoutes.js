import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
} from '../controllers/productController.js';

import { requireAuth, requireRole, enforceCompanyScope, enforceOwnerScope } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(enforceCompanyScope);
router.use(enforceOwnerScope);

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

router.post('/:id/restore', requireRole('admin'), restoreProduct);

export default router;
