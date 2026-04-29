import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Product from '../models/Product.js';
import Devis from '../models/Devis.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Reminder from '../models/Reminder.js';
import AuditLog from '../models/AuditLog.js';
import { buildCompanyScope, getCompanyId, toObjectId } from '../utils/scope.js';

const ensureAdminCompany = (req, next) => {
  const companyId = getCompanyId(req);
  if (!companyId) {
    next(new ErrorResponse('Your account is not linked to any company.', 400));
    return null;
  }
  return companyId;
};

const ensureCompanyUser = async (userId, companyId) => {
  const companyObjectId = toObjectId(companyId);
  if (!companyObjectId) {
    return null;
  }

  return User.findOne({ _id: userId, company: companyObjectId })
    .select('name email role company createdAt updatedAt');
};

const userDetailProjection = 'name email role company createdAt updatedAt';

const getCompanyPopulatedUserDetail = async (userId, companyId) => {
  const companyObjectId = toObjectId(companyId);
  if (!companyObjectId) {
    return null;
  }

  return User.findOne({ _id: userId, company: companyObjectId })
    .populate('company')
    .select(userDetailProjection);
};

const getUserParamId = (req) => req.params.userId || req.params.id;

export const getCompanyUsers = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const companyObjectId = toObjectId(companyId);
  if (!companyObjectId) {
    return next(new ErrorResponse('Your account is not linked to any company.', 400));
  }

  const users = await User.find({ company: companyObjectId })
    .populate('company')
    .select('name email role company createdAt updatedAt')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: users.length, data: users, users });
});

export const getUserById = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const user = await getCompanyPopulatedUserDetail(getUserParamId(req), companyId);
  if (!user) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  res.status(200).json({ success: true, data: user });
});

export const createUser = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const {
    name,
    email,
    password,
    role = 'user',
    companyId: _bodyCompanyId,
  } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorResponse('Name, email and password are required', 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 409));
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    company: companyId,
  });

  const createdUser = await getCompanyPopulatedUserDetail(user._id, companyId);

  res.status(201).json({
    success: true,
    data: createdUser,
  });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const user = await ensureCompanyUser(getUserParamId(req), companyId);
  if (!user) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  const {
    name,
    email,
    password,
    role,
    companyId: bodyCompanyId,
  } = req.body;

  if (email && email !== user.email) {
    const duplicateUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (duplicateUser) {
      return next(new ErrorResponse('Email already registered', 409));
    }
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (bodyCompanyId !== undefined) {
    const normalizedRequestedCompany = bodyCompanyId ? String(bodyCompanyId) : null;
    const normalizedCurrentCompany = String(companyId);
    if (normalizedRequestedCompany !== normalizedCurrentCompany) {
      return next(new ErrorResponse('You can only assign users to your own company.', 403));
    }
    user.company = companyId;
  }
  if (password) user.password = password;

  await user.save();

  const updatedUser = await getCompanyPopulatedUserDetail(user._id, companyId);

  res.status(200).json({
    success: true,
    data: updatedUser,
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const userId = getUserParamId(req);

  if (String(req.user.id) === String(userId)) {
    return next(new ErrorResponse('You cannot delete your own account', 400));
  }

  const user = await ensureCompanyUser(userId, companyId);
  if (!user) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    data: {},
  });
});

export const getUserSummary = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const user = await ensureCompanyUser(getUserParamId(req), companyId);
  if (!user) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  const ownerUserId = toObjectId(user._id) || user._id;
  const companyScope = buildCompanyScope(user.company || companyId);
  const scope = { ...companyScope, ownerUserId, deletedAt: null };

  const [clients, products, quotes, invoices, payments, reminders, revenueStats, lastInvoiceDoc] = await Promise.all([
    Client.countDocuments(scope),
    Product.countDocuments(scope),
    Devis.countDocuments(scope),
    Invoice.countDocuments(scope),
    Payment.countDocuments({ ...companyScope, ownerUserId, deletedAt: null }),
    Reminder.countDocuments({ ...companyScope, ownerUserId, deletedAt: null }),
    Invoice.aggregate([
      { $match: scope },
      { $group: { _id: null, billed: { $sum: '$totalAmount' }, paid: { $sum: '$amountPaid' } } },
    ]),
    Invoice.findOne(scope).sort({ createdAt: -1 }).select('number createdAt status totalAmount amountPaid').lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      counts: {
        clients,
        products,
        quotes,
        invoices,
        payments,
        reminders,
      },
      revenue: {
        billed: revenueStats.length > 0 ? revenueStats[0].billed : 0,
        paid: revenueStats.length > 0 ? revenueStats[0].paid : 0,
      },
      lastInvoice: lastInvoiceDoc,
    },
  });
});

export const getUserData = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const user = await ensureCompanyUser(getUserParamId(req), companyId);
  if (!user) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  const ownerUserId = toObjectId(user._id) || user._id;
  const companyScope = buildCompanyScope(user.company || companyId);
  const type = String(req.query.type || '').toLowerCase();
  const deletedAt = req.query.includeDeleted === 'true' ? undefined : null;

  const baseQuery = {
    ...companyScope,
    ownerUserId,
  };

  const queryWithDeletedFilter = deletedAt === undefined
    ? baseQuery
    : { ...baseQuery, deletedAt };

  let data = [];

  switch (type) {
    case 'clients':
      data = await Client.find(queryWithDeletedFilter).sort({ createdAt: -1 }).lean();
      break;
    case 'products':
      data = await Product.find(queryWithDeletedFilter).sort({ createdAt: -1 }).lean();
      break;
    case 'quotes':
      data = await Devis.find(queryWithDeletedFilter).populate('client').sort({ createdAt: -1 });
      break;
    case 'invoices':
      data = await Invoice.find(queryWithDeletedFilter).populate('client').sort({ createdAt: -1 });
      break;
    case 'payments':
      data = await Payment.find(queryWithDeletedFilter).sort({ createdAt: -1 }).lean();
      break;
    case 'reminders':
      data = await Reminder.find(queryWithDeletedFilter).sort({ createdAt: -1 }).lean();
      break;
    default:
      return next(new ErrorResponse('Unsupported data type', 400));
  }

  res.status(200).json({ success: true, count: data.length, data });
});

export const getUserAuditLogs = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const user = await ensureCompanyUser(getUserParamId(req), companyId);
  if (!user) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  const logs = await AuditLog.find({ $or: [{ targetUserId: user._id }, { actorUserId: user._id }] })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: logs.length, data: logs });
});

export const getUserClients = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const user = await ensureCompanyUser(getUserParamId(req), companyId);
  if (!user) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  const ownerUserId = toObjectId(user._id) || user._id;
  const companyScope = buildCompanyScope(user.company || companyId);
  const clients = await Client.find({ ...companyScope, ownerUserId, deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: clients.length, data: clients });
});

export const getUserStats = asyncHandler(async (req, res, next) => {
  const companyId = ensureAdminCompany(req, next);
  if (!companyId) return;

  const user = await ensureCompanyUser(getUserParamId(req), companyId);
  if (!user) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  const ownerUserId = toObjectId(user._id) || user._id;
  const companyScope = buildCompanyScope(companyId);
  const scope = { ...companyScope, ownerUserId, deletedAt: null };

  const unpaidAgg = await Invoice.aggregate([
    { $match: { ...scope, status: { $in: ['Unpaid', 'Partially Paid', 'Overdue'] } } },
    { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$amountPaid'] } } } },
  ]);

  const overdueCount = await Invoice.countDocuments({
    ...scope,
    status: { $ne: 'Paid' },
    dueDate: { $lt: new Date() },
  });

  const startOfQuarter = new Date();
  startOfQuarter.setMonth(Math.floor(startOfQuarter.getMonth() / 3) * 3, 1);
  startOfQuarter.setHours(0, 0, 0, 0);
  const endOfQuarter = new Date(startOfQuarter);
  endOfQuarter.setMonth(endOfQuarter.getMonth() + 3);

  const quarterlyAgg = await Invoice.aggregate([
    {
      $match: {
        ...scope,
        createdAt: { $gte: startOfQuarter, $lt: endOfQuarter },
      },
    },
    {
      $group: {
        _id: null,
        totalBilled: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$amountPaid' },
      },
    },
  ]);

  const totalBilled = quarterlyAgg.length > 0 ? quarterlyAgg[0].totalBilled : 0;
  const totalPaid = quarterlyAgg.length > 0 ? quarterlyAgg[0].totalPaid : 0;
  const paymentRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  res.status(200).json({
    success: true,
    userId: user._id,
    data: {
      totalUnpaid: unpaidAgg.length > 0 ? unpaidAgg[0].total : 0,
      overdueCount,
      quarterly: {
        paymentRate,
        totalBilled,
        totalPaid,
      },
    },
  });
});
