import mongoose from 'mongoose';

export const toObjectId = (value) => {
  if (!value || !mongoose.isValidObjectId(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

export const getCompanyId = (req) => req.user?.company?._id || req.user?.company || null;

export const getOwnerUserId = (req) => {
  if (!req.user) return null;
  if (req.user.role === 'admin') {
    return req.query.ownerUserId || null;
  }
  return req.user.id || req.user._id;
};

export const buildCompanyScope = (companyId) => {
  const objectId = toObjectId(companyId);
  if (!objectId) {
    return null;
  }

  return {
    $or: [
      { company: objectId },
      { companyId: objectId },
    ],
  };
};

export const buildScopedQuery = (req, extra = {}) => {
  const companyId = getCompanyId(req);
  const companyScope = buildCompanyScope(companyId);
  if (!companyScope) {
    return null;
  }

  const query = {
    ...companyScope,
    ...extra,
  };

  if (req.user?.role === 'user') {
    const ownerUserId = req.user.id || req.user._id;
    query.ownerUserId = toObjectId(ownerUserId) || ownerUserId;
  } else if (req.query.ownerUserId) {
    const ownerUserId = toObjectId(req.query.ownerUserId);
    if (ownerUserId) {
      query.ownerUserId = ownerUserId;
    }
  }

  return query;
};

export const buildEntityAccessQuery = (req, extra = {}) => {
  const companyId = getCompanyId(req);
  const companyScope = buildCompanyScope(companyId);
  if (!companyScope) {
    return null;
  }

  const query = {
    ...companyScope,
    ...extra,
  };

  if (req.user?.role === 'user') {
    const ownerUserId = req.user.id || req.user._id;
    query.ownerUserId = toObjectId(ownerUserId) || ownerUserId;
  } else if (req.query.ownerUserId) {
    const ownerUserId = toObjectId(req.query.ownerUserId);
    if (ownerUserId) {
      query.ownerUserId = ownerUserId;
    }
  }

  return query;
};
