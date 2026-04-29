import jwt from 'jsonwebtoken';
import asyncHandler from './async.js';
import ErrorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import { getCompanyId, toObjectId } from '../utils/scope.js';

// Protect routes - Verify JWT and fetch user from DB (source of truth)
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token from cookie (preferred) or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Block if no token
  if (!token) {
    return next(new ErrorResponse('Accès refusé. Veuillez vous connecter.', 401));
  }

  try {
    // 3. Verify signature and expiry (NOT just decode)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Set req.user from DB (The only source of truth for Role and Company)
    // Re-fetch user to include current role and company association
    req.token = token;
    req.user = await User.findById(decoded.id).populate('company');
    
    if (!req.user) {
        return next(new ErrorResponse('Utilisateur introuvable.', 401));
    }

    req.user.companyId = req.user.company?._id || req.user.company || null;

    next();
  } catch (err) {
    return next(new ErrorResponse('Session expirée ou invalide.', 401));
  }
});

export const requireAuth = protect;

/**
 * RBAC Guard: Restrict access to specific roles
 * Usage: router.get('/admin-only', protect, authorize('admin'), controller)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          'Accès interdit : privilèges insuffisants.',
          403
        )
      );
    }
    next();
  };
};

export const requireRole = (...roles) => authorize(...roles);
export const requireAdmin = requireRole('admin');

export const enforceCompanyScope = (req, res, next) => {
  const companyId = getCompanyId(req);
  if (!companyId || !toObjectId(companyId)) {
    return next(new ErrorResponse('Your account is not linked to any company.', 400));
  }

  req.companyId = companyId;
  next();
};

export const enforceOwnerScope = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Accès refusé. Veuillez vous connecter.', 401));
  }

  if (req.user.role === 'user') {
    req.ownerUserId = req.user.id || req.user._id;
  } else if (req.query.ownerUserId) {
    req.ownerUserId = req.query.ownerUserId;
  } else {
    req.ownerUserId = null;
  }

  next();
};
