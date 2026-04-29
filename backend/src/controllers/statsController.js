import Invoice from '../models/Invoice.js';
import Devis from '../models/Devis.js';
import Client from '../models/Client.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/async.js';
import mongoose from 'mongoose';
import ErrorResponse from '../utils/errorResponse.js';
import { buildCompanyScope, buildScopedQuery, getCompanyId, toObjectId } from '../utils/scope.js';

const emptyStats = {
  totalUnpaid: 0,
  overdueCount: 0,
  monthlyRevenue: [],
  topClients: [],
  productsCount: 0,
  totalClients: 0,
  quarterly: {
    paymentRate: 0,
    totalBilled: 0,
    totalPaid: 0,
  },
  estimation: 0,
  lastInvoice: null,
};

const getDateRange = (month, year) => {
  const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const selectedMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();
  const startDate = new Date(selectedYear, selectedMonth, 1);
  const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

const computeStats = async ({ scopeMatch, month, year }) => {
  if (!scopeMatch) {
    return emptyStats;
  }

  const { startDate, endDate } = getDateRange(month, year);

  const unpaidStats = await Invoice.aggregate([
    { $match: { ...scopeMatch, status: { $in: ['sent', 'unpaid', 'overdue'] } } },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', '$amountPaid'] }],
          },
        },
      },
    },
  ]);

  const overdueCount = await Invoice.countDocuments({
    ...scopeMatch,
    status: { $ne: 'paid' },
    dueDate: { $lt: new Date() },
  });

  const monthlyRevenue = await Invoice.aggregate([
    {
      $match: {
        ...scopeMatch,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const productsCount = await Product.countDocuments(scopeMatch);
  const totalClients = await Client.countDocuments(scopeMatch);

  const topClients = await Invoice.aggregate([
    { $match: scopeMatch },
    { $group: { _id: '$client', totalSpent: { $sum: '$totalAmount' } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'clientDetails',
      },
    },
    { $unwind: { path: '$clientDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        totalSpent: 1,
        clientDetails: {
          name: { $ifNull: ['$clientDetails.name', 'Client supprime'] },
        },
      },
    },
  ]);

  const startOfQuarter = new Date();
  startOfQuarter.setMonth(Math.floor(startOfQuarter.getMonth() / 3) * 3, 1);
  startOfQuarter.setHours(0, 0, 0, 0);

  const endOfQuarter = new Date(startOfQuarter);
  endOfQuarter.setMonth(endOfQuarter.getMonth() + 3);

  const quarterlyStats = await Invoice.aggregate([
    {
      $match: {
        ...scopeMatch,
        createdAt: { $gte: startOfQuarter, $lt: endOfQuarter },
      },
    },
    {
      $group: {
        _id: null,
        totalBilled: { $sum: '$totalAmount' },
        totalPaid: { $sum: { $ifNull: ['$paidAmount', '$amountPaid'] } },
      },
    },
  ]);

  const billed = quarterlyStats.length > 0 ? quarterlyStats[0].totalBilled : 0;
  const paid = quarterlyStats.length > 0 ? quarterlyStats[0].totalPaid : 0;
  const paymentRate = billed > 0 ? Math.round((paid / billed) * 100) : 0;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const quoteEstimation = await Devis.aggregate([
    {
      $match: {
        ...scopeMatch,
        status: 'Sent',
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  const lastInvoiceDoc = await Invoice.findOne(scopeMatch)
    .sort({ createdAt: -1 })
    .select('number createdAt')
    .lean();

  const lastInvoice = lastInvoiceDoc
    ? { invoiceNumber: lastInvoiceDoc.number, createdAt: lastInvoiceDoc.createdAt }
    : null;

  return {
    totalUnpaid: unpaidStats.length > 0 ? unpaidStats[0].total : 0,
    overdueCount,
    monthlyRevenue,
    topClients,
    productsCount,
    totalClients,
    quarterly: {
      paymentRate,
      totalBilled: billed,
      totalPaid: paid,
    },
    estimation: quoteEstimation.length > 0 ? quoteEstimation[0].total : 0,
    lastInvoice,
  };
};

// @desc    Get dashboard summary stats (user-scoped for users, company-scoped for admins)
// @route   GET /api/stats/summary
// @access  Private
export const getSummaryStats = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId || !mongoose.isValidObjectId(companyId)) {
    return res.status(200).json({ success: true, data: emptyStats });
  }

  const scopeMatch = buildScopedQuery(req, { deletedAt: null });
  if (!scopeMatch) {
    return res.status(200).json({ success: true, data: emptyStats });
  }

  const data = await computeStats({
    scopeMatch,
    month: req.query.month,
    year: req.query.year,
  });

  res.status(200).json({ success: true, data });
});

// @desc    Get company-wide stats
// @route   GET /api/stats/company
// @access  Private/Admin
export const getCompanyStats = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId || !mongoose.isValidObjectId(companyId)) {
    return res.status(200).json({ success: true, data: emptyStats });
  }

  const scopeMatch = buildScopedQuery(req, { deletedAt: null });
  if (!scopeMatch) {
    return res.status(200).json({ success: true, data: emptyStats });
  }

  const data = await computeStats({
    scopeMatch,
    month: req.query.month,
    year: req.query.year,
  });

  res.status(200).json({ success: true, data });
});

// @desc    Get one user stats (admin supervision)
// @route   GET /api/stats/user/:userId
// @access  Private/Admin
export const getUserStats = asyncHandler(async (req, res, next) => {
  const companyId = getCompanyId(req);
  if (!companyId || !mongoose.isValidObjectId(companyId)) {
    return res.status(200).json({ success: true, data: emptyStats });
  }

  const companyObjectId = toObjectId(companyId);
  if (!companyObjectId) {
    return res.status(200).json({ success: true, data: emptyStats });
  }

  const targetUser = await User.findOne({
    _id: req.params.userId,
    company: companyObjectId,
  }).select('_id');

  if (!targetUser) {
    return next(new ErrorResponse('User not found in your company', 404));
  }

  const companyScope = buildCompanyScope(companyId);
  const ownerUserId = toObjectId(targetUser._id) || targetUser._id;

  const data = await computeStats({
    scopeMatch: {
      ...companyScope,
      ownerUserId,
      deletedAt: null,
    },
    month: req.query.month,
    year: req.query.year,
  });

  res.status(200).json({
    success: true,
    userId: targetUser._id,
    data,
  });
});
