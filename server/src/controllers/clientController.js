import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import Client from '../models/Client.js';
import { recordAudit } from '../utils/audit.js';
import { buildScopedQuery, getCompanyId, toObjectId } from '../utils/scope.js';

const buildClientQuery = (req, extra = {}) => buildScopedQuery(req, extra);

export const getClients = asyncHandler(async (req, res) => {
  const query = buildClientQuery(req, { deletedAt: null });
  if (!query) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  const clients = await Client.find(query).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    success: true,
    count: clients.length,
    data: clients,
  });
});

export const getClient = asyncHandler(async (req, res, next) => {
  const query = buildClientQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Client introuvable', 404));
  }

  const client = await Client.findOne(query).lean();
  if (!client) {
    return next(new ErrorResponse('Client introuvable', 404));
  }

  res.status(200).json({
    success: true,
    data: client,
  });
});

export const createClient = asyncHandler(async (req, res, next) => {
  const companyId = getCompanyId(req);
  const ownerUserId = req.user.id || req.user._id;
  if (!companyId) {
    return next(new ErrorResponse('Votre compte n\'est pas rattaché à une société.', 400));
  }

  const payload = {
    ...req.body,
    company: companyId,
    companyId,
    ownerUserId: toObjectId(ownerUserId) || ownerUserId,
  };

  const client = await Client.create(payload);
  await recordAudit({
    req,
    companyId,
    targetUserId: ownerUserId,
    entityType: 'Client',
    entityId: client._id,
    action: 'CREATE',
    afterJson: client,
  });

  res.status(201).json({
    success: true,
    data: client,
  });
});

export const updateClient = asyncHandler(async (req, res, next) => {
  const query = buildClientQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Client introuvable', 404));
  }

  const client = await Client.findOne(query);
  if (!client) {
    return next(new ErrorResponse('Client introuvable', 404));
  }

  const beforeJson = client.toObject();
  const updatableFields = (({ company, companyId, ownerUserId, deletedAt, deletedByUserId, ...rest }) => rest)(req.body);
  Object.assign(client, updatableFields);
  client.company = client.company || getCompanyId(req);
  client.companyId = client.companyId || getCompanyId(req);
  await client.save();

  await recordAudit({
    req,
    companyId: client.companyId,
    targetUserId: client.ownerUserId,
    entityType: 'Client',
    entityId: client._id,
    action: 'UPDATE',
    beforeJson,
    afterJson: client,
  });

  res.status(200).json({
    success: true,
    data: client,
  });
});

export const deleteClient = asyncHandler(async (req, res, next) => {
  const query = buildClientQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Client introuvable', 404));
  }

  const client = await Client.findOne(query);
  if (!client) {
    return next(new ErrorResponse('Client introuvable', 404));
  }

  const beforeJson = client.toObject();
  client.deletedAt = new Date();
  client.deletedByUserId = req.user.id || req.user._id;
  await client.save();

  await recordAudit({
    req,
    companyId: client.companyId || client.company,
    targetUserId: client.ownerUserId,
    entityType: 'Client',
    entityId: client._id,
    action: 'DELETE',
    beforeJson,
    afterJson: client,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

export const restoreClient = asyncHandler(async (req, res, next) => {
  const query = buildClientQuery(req, { _id: req.params.id, deletedAt: { $ne: null } });
  if (!query) {
    return next(new ErrorResponse('Client introuvable', 404));
  }

  const client = await Client.findOne(query);
  if (!client) {
    return next(new ErrorResponse('Client introuvable', 404));
  }

  const beforeJson = client.toObject();
  client.deletedAt = null;
  client.deletedByUserId = null;
  await client.save();

  await recordAudit({
    req,
    companyId: client.companyId || client.company,
    targetUserId: client.ownerUserId,
    entityType: 'Client',
    entityId: client._id,
    action: 'RESTORE',
    beforeJson,
    afterJson: client,
  });

  res.status(200).json({
    success: true,
    data: client,
  });
});
