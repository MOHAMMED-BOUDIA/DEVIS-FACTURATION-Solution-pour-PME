import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import Product from '../models/Product.js';
import { recordAudit } from '../utils/audit.js';
import { buildScopedQuery, getCompanyId, toObjectId } from '../utils/scope.js';

const buildProductQuery = (req, extra = {}) => buildScopedQuery(req, extra);

export const getProducts = asyncHandler(async (req, res) => {
  const query = buildProductQuery(req, { deletedAt: null });
  if (!query) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  const products = await Product.find(query).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

export const getProduct = asyncHandler(async (req, res, next) => {
  const query = buildProductQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Produit introuvable', 404));
  }

  const product = await Product.findOne(query).lean();
  if (!product) {
    return next(new ErrorResponse('Produit introuvable', 404));
  }

  res.status(200).json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res, next) => {
  const companyId = getCompanyId(req);
  const ownerUserId = req.user.id || req.user._id;
  if (!companyId) {
    return next(new ErrorResponse('Votre compte n\'est pas rattaché à une société.', 400));
  }

  const product = await Product.create({
    ...req.body,
    company: companyId,
    companyId,
    ownerUserId: toObjectId(ownerUserId) || ownerUserId,
  });

  await recordAudit({
    req,
    companyId,
    targetUserId: ownerUserId,
    entityType: 'Product',
    entityId: product._id,
    action: 'CREATE',
    afterJson: product,
  });

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const query = buildProductQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Produit introuvable', 404));
  }

  const product = await Product.findOne(query);
  if (!product) {
    return next(new ErrorResponse('Produit introuvable', 404));
  }

  const beforeJson = product.toObject();
  const updatableFields = (({ company, companyId, ownerUserId, deletedAt, deletedByUserId, ...rest }) => rest)(req.body);
  Object.assign(product, updatableFields);
  product.company = product.company || getCompanyId(req);
  product.companyId = product.companyId || getCompanyId(req);
  await product.save();

  await recordAudit({
    req,
    companyId: product.companyId,
    targetUserId: product.ownerUserId,
    entityType: 'Product',
    entityId: product._id,
    action: 'UPDATE',
    beforeJson,
    afterJson: product,
  });

  res.status(200).json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const query = buildProductQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Produit introuvable', 404));
  }

  const product = await Product.findOne(query);
  if (!product) {
    return next(new ErrorResponse('Produit introuvable', 404));
  }

  const beforeJson = product.toObject();
  product.deletedAt = new Date();
  product.deletedByUserId = req.user.id || req.user._id;
  await product.save();

  await recordAudit({
    req,
    companyId: product.companyId || product.company,
    targetUserId: product.ownerUserId,
    entityType: 'Product',
    entityId: product._id,
    action: 'DELETE',
    beforeJson,
    afterJson: product,
  });

  res.status(200).json({ success: true, data: {} });
});

export const restoreProduct = asyncHandler(async (req, res, next) => {
  const query = buildProductQuery(req, { _id: req.params.id, deletedAt: { $ne: null } });
  if (!query) {
    return next(new ErrorResponse('Produit introuvable', 404));
  }

  const product = await Product.findOne(query);
  if (!product) {
    return next(new ErrorResponse('Produit introuvable', 404));
  }

  const beforeJson = product.toObject();
  product.deletedAt = null;
  product.deletedByUserId = null;
  await product.save();

  await recordAudit({
    req,
    companyId: product.companyId || product.company,
    targetUserId: product.ownerUserId,
    entityType: 'Product',
    entityId: product._id,
    action: 'RESTORE',
    beforeJson,
    afterJson: product,
  });

  res.status(200).json({ success: true, data: product });
});
