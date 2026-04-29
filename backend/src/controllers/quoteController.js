import Devis from '../models/Devis.js';
import Invoice from '../models/Invoice.js';
import Company from '../models/Company.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import { generateQuotePDF } from '../utils/pdfService.js';
import { recordAudit } from '../utils/audit.js';
import { buildScopedQuery, getCompanyId, toObjectId } from '../utils/scope.js';

const QUOTE_STATUS = {
  draft: 'draft',
  sent: 'sent',
  accepted: 'accepted',
  rejected: 'rejected',
  expired: 'expired',
};

const LEGACY_QUOTE_STATUS_MAP = {
  Draft: QUOTE_STATUS.draft,
  Sent: QUOTE_STATUS.sent,
  Accepted: QUOTE_STATUS.accepted,
  Rejected: QUOTE_STATUS.rejected,
  Expired: QUOTE_STATUS.expired,
  Invoiced: QUOTE_STATUS.accepted,
};

const normalizeQuoteStatus = (status, fallback = QUOTE_STATUS.draft) => {
  if (!status) {
    return fallback;
  }

  if (LEGACY_QUOTE_STATUS_MAP[status]) {
    return LEGACY_QUOTE_STATUS_MAP[status];
  }

  const normalized = String(status).toLowerCase();
  return Object.values(QUOTE_STATUS).includes(normalized) ? normalized : fallback;
};

const normalizeLineItems = (items = [], companyId, ownerUserId) => items.map((item) => ({
  ...item,
  companyId,
  ownerUserId,
  total: Number(item.quantity || 0) * Number(item.price || 0),
}));

const calculateTotals = (items = []) => items.reduce((accumulator, item) => {
  const total = Number(item.quantity || 0) * Number(item.price || 0);
  const taxRate = Number(item.taxRate ?? 20);
  accumulator.subtotal += total;
  accumulator.taxAmount += (total * taxRate) / 100;
  return accumulator;
}, { subtotal: 0, taxAmount: 0 });

const buildQuoteQuery = (req, extra = {}) => buildScopedQuery(req, extra);

const getValidUntil = (payload = {}, fallbackDate = null) => {
  const value = payload.validUntil || payload.expiryDate || fallbackDate;
  if (!value) {
    return new Date(+new Date() + 30 * 24 * 60 * 60 * 1000);
  }

  return new Date(value);
};

const buildUniqueQuoteNumber = async (company, companyId) => {
  const year = new Date().getFullYear();
  const prefix = company?.settings?.quotePrefix || 'DEVIS-';
  let sequence = await Devis.countDocuments({
    $or: [{ company: companyId }, { companyId }],
  });

  let candidate;
  let exists;
  do {
    sequence += 1;
    candidate = `${prefix}${year}-${String(sequence).padStart(4, '0')}`;
    exists = await Devis.exists({ number: candidate });
  } while (exists);

  return candidate;
};

const expireOutdatedQuotes = async (req) => {
  const expirationQuery = buildQuoteQuery(req, {
    deletedAt: null,
    status: QUOTE_STATUS.sent,
    validUntil: { $lt: new Date() },
  });

  if (!expirationQuery) {
    return;
  }

  await Devis.updateMany(expirationQuery, {
    $set: { status: QUOTE_STATUS.expired },
  });
};

const syncQuoteComputedFields = (quote) => {
  quote.validUntil = getValidUntil(quote, quote.validUntil);
  quote.expiryDate = quote.validUntil;
  quote.status = normalizeQuoteStatus(quote.status, QUOTE_STATUS.draft);
};

const updateQuoteStatus = async ({ req, quote, nextStatus, action, errorMessage }) => {
  const beforeJson = quote.toObject();
  quote.status = nextStatus;
  quote.validUntil = getValidUntil(quote, quote.validUntil);
  quote.expiryDate = quote.validUntil;
  await quote.save();

  await recordAudit({
    req,
    companyId: quote.companyId || quote.company,
    targetUserId: quote.ownerUserId,
    entityType: 'Quote',
    entityId: quote._id,
    action,
    beforeJson,
    afterJson: quote,
    errorMessage,
  });

  return quote;
};

// @desc    Generate PDF for quote
// @route   GET /api/quotes/:id/pdf
// @access  Private
export const getQuotePDF = asyncHandler(async (req, res, next) => {
  const companyId = getCompanyId(req);
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: null });
  if (!companyId || !query) {
    return next(new ErrorResponse('Your account is not linked to any company.', 400));
  }

  await expireOutdatedQuotes(req);
  const quote = await Devis.findOne(query).populate('client');
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  syncQuoteComputedFields(quote);
  if (quote.isModified()) {
    await quote.save();
  }

  const company = await Company.findById(companyId);
  const pdfBuffer = await generateQuotePDF(quote, company);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=quote-${quote.number}.pdf`);
  res.send(pdfBuffer);
});

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private
export const getQuotes = asyncHandler(async (req, res) => {
  const query = buildQuoteQuery(req, { deletedAt: null });
  if (!query) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  await expireOutdatedQuotes(req);
  const quotes = await Devis.find(query).populate('client').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: quotes.length, data: quotes });
});

// @desc    Get single quote
// @route   GET /api/quotes/:id
// @access  Private
export const getQuote = asyncHandler(async (req, res, next) => {
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  await expireOutdatedQuotes(req);
  const quote = await Devis.findOne(query).populate('client');
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  syncQuoteComputedFields(quote);
  if (quote.isModified()) {
    await quote.save();
  }

  res.status(200).json({ success: true, data: quote });
});

// @desc    Create new quote
// @route   POST /api/quotes
// @access  Private
export const createQuote = asyncHandler(async (req, res, next) => {
  const companyId = getCompanyId(req);
  const ownerUserId = req.user.id || req.user._id;
  if (!companyId) {
    return next(new ErrorResponse('Your account is not linked to any company.', 400));
  }

  const company = await Company.findById(companyId);
  if (!company) {
    return next(new ErrorResponse('Company not found', 404));
  }

  const items = normalizeLineItems(req.body.items || [], companyId, toObjectId(ownerUserId) || ownerUserId);
  const { subtotal, taxAmount } = calculateTotals(items);
  const totalAmount = subtotal + taxAmount;
  const validUntil = getValidUntil(req.body);

  const hasManualNumber = Boolean(req.body.number);
  let quote;
  let attempts = 0;

  while (!quote && attempts < 3) {
    attempts += 1;
    const number = hasManualNumber ? req.body.number : await buildUniqueQuoteNumber(company, companyId);

    try {
      quote = await Devis.create({
        ...req.body,
        number,
        items,
        company: companyId,
        companyId,
        ownerUserId: toObjectId(ownerUserId) || ownerUserId,
        validUntil,
        expiryDate: validUntil,
        subtotal,
        taxAmount,
        totalAmount,
        status: normalizeQuoteStatus(req.body.status, QUOTE_STATUS.draft),
      });
    } catch (error) {
      const duplicateNumber = error?.code === 11000 && (error?.keyPattern?.number || error?.keyValue?.number);
      if (!duplicateNumber || hasManualNumber || attempts >= 3) {
        throw error;
      }
    }
  }

  await recordAudit({
    req,
    companyId,
    targetUserId: ownerUserId,
    entityType: 'Quote',
    entityId: quote._id,
    action: 'CREATE',
    afterJson: quote,
  });

  res.status(201).json({ success: true, data: quote });
});

// @desc    Update quote
// @route   PUT /api/quotes/:id
// @access  Private
export const updateQuote = asyncHandler(async (req, res, next) => {
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const quote = await Devis.findOne(query);
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const normalizedStatus = normalizeQuoteStatus(quote.status, QUOTE_STATUS.draft);
  if ([QUOTE_STATUS.rejected, QUOTE_STATUS.expired].includes(normalizedStatus)) {
    return next(new ErrorResponse('Cannot update a rejected or expired quote', 400));
  }

  const beforeJson = quote.toObject();
  const nextItems = req.body.items ? normalizeLineItems(req.body.items, quote.companyId || quote.company, quote.ownerUserId) : null;
  const totals = nextItems ? calculateTotals(nextItems) : null;

  const updatableFields = (({ company, companyId, ownerUserId, deletedAt, deletedByUserId, ...rest }) => rest)(req.body);
  Object.assign(quote, updatableFields);
  if (nextItems) {
    quote.items = nextItems;
    quote.subtotal = totals.subtotal;
    quote.taxAmount = totals.taxAmount;
    quote.totalAmount = totals.subtotal + totals.taxAmount;
  }

  quote.company = quote.company || getCompanyId(req);
  quote.companyId = quote.companyId || getCompanyId(req);
  quote.validUntil = getValidUntil(req.body, quote.validUntil || quote.expiryDate);
  quote.expiryDate = quote.validUntil;
  quote.status = normalizeQuoteStatus(req.body.status, normalizedStatus);
  await quote.save();

  await recordAudit({
    req,
    companyId: quote.companyId,
    targetUserId: quote.ownerUserId,
    entityType: 'Quote',
    entityId: quote._id,
    action: 'UPDATE',
    beforeJson,
    afterJson: quote,
  });

  res.status(200).json({ success: true, data: quote });
});

// @desc    Send quote
// @route   POST /api/quotes/:id/send
// @access  Private
export const sendQuote = asyncHandler(async (req, res, next) => {
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const quote = await Devis.findOne(query);
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const currentStatus = normalizeQuoteStatus(quote.status, QUOTE_STATUS.draft);
  if (currentStatus !== QUOTE_STATUS.draft) {
    return next(new ErrorResponse('Only draft quotes can be sent', 400));
  }

  const updatedQuote = await updateQuoteStatus({
    req,
    quote,
    nextStatus: QUOTE_STATUS.sent,
    action: 'UPDATE',
  });

  res.status(200).json({ success: true, data: updatedQuote });
});

// @desc    Mark quote accepted
// @route   POST /api/quotes/:id/accept
// @access  Private
export const markQuoteAccepted = asyncHandler(async (req, res, next) => {
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const quote = await Devis.findOne(query);
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const currentStatus = normalizeQuoteStatus(quote.status, QUOTE_STATUS.draft);
  if (currentStatus !== QUOTE_STATUS.sent) {
    return next(new ErrorResponse('Only sent quotes can be accepted', 400));
  }

  const updatedQuote = await updateQuoteStatus({
    req,
    quote,
    nextStatus: QUOTE_STATUS.accepted,
    action: 'UPDATE',
  });

  res.status(200).json({ success: true, data: updatedQuote });
});

// @desc    Mark quote rejected
// @route   POST /api/quotes/:id/reject
// @access  Private
export const markQuoteRejected = asyncHandler(async (req, res, next) => {
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const quote = await Devis.findOne(query);
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const currentStatus = normalizeQuoteStatus(quote.status, QUOTE_STATUS.draft);
  if (currentStatus !== QUOTE_STATUS.sent) {
    return next(new ErrorResponse('Only sent quotes can be rejected', 400));
  }

  const updatedQuote = await updateQuoteStatus({
    req,
    quote,
    nextStatus: QUOTE_STATUS.rejected,
    action: 'UPDATE',
  });

  res.status(200).json({ success: true, data: updatedQuote });
});

// @desc    Convert quote to invoice
// @route   POST /api/quotes/:id/convert
// @access  Private
export const convertToInvoice = asyncHandler(async (req, res, next) => {
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const quote = await Devis.findOne(query);
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const currentStatus = normalizeQuoteStatus(quote.status, QUOTE_STATUS.draft);
  if (currentStatus !== QUOTE_STATUS.accepted) {
    return next(new ErrorResponse('Only accepted quotes can be converted to invoice', 400));
  }

  const existingInvoice = await Invoice.findOne({
    devisReference: quote._id,
    deletedAt: null,
  });
  if (existingInvoice) {
    return next(new ErrorResponse('Quote already converted to invoice', 400));
  }

  const company = await Company.findById(quote.companyId || quote.company);
  if (!company) {
    return next(new ErrorResponse('Company not found', 404));
  }

  const count = await Invoice.countDocuments({ company: quote.companyId || quote.company });
  const year = new Date().getFullYear();
  const invoiceNumber = `${company.settings.invoicePrefix}${year}-${(count + 1).toString().padStart(4, '0')}`;

  const invoice = await Invoice.create({
    number: invoiceNumber,
    devisReference: quote._id,
    client: quote.client,
    company: quote.company,
    companyId: quote.companyId || quote.company,
    ownerUserId: quote.ownerUserId,
    date: new Date(),
    dueDate: new Date(+new Date() + 30 * 24 * 60 * 60 * 1000),
    items: normalizeLineItems(quote.items, quote.companyId || quote.company, quote.ownerUserId),
    subtotal: quote.subtotal,
    taxAmount: quote.taxAmount,
    totalAmount: quote.totalAmount,
    paidAmount: 0,
    amountPaid: 0,
    remainingAmount: quote.totalAmount,
    status: 'draft',
  });

  await recordAudit({
    req,
    companyId: quote.companyId || quote.company,
    targetUserId: quote.ownerUserId,
    entityType: 'Invoice',
    entityId: invoice._id,
    action: 'CREATE',
    afterJson: invoice,
  });

  res.status(201).json({ success: true, data: invoice });
});

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private
export const deleteQuote = asyncHandler(async (req, res, next) => {
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const quote = await Devis.findOne(query);
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const beforeJson = quote.toObject();
  quote.deletedAt = new Date();
  quote.deletedByUserId = req.user.id || req.user._id;
  await quote.save();

  await recordAudit({
    req,
    companyId: quote.companyId || quote.company,
    targetUserId: quote.ownerUserId,
    entityType: 'Quote',
    entityId: quote._id,
    action: 'DELETE',
    beforeJson,
    afterJson: quote,
  });

  res.status(200).json({ success: true, data: {} });
});

export const restoreQuote = asyncHandler(async (req, res, next) => {
  const query = buildQuoteQuery(req, { _id: req.params.id, deletedAt: { $ne: null } });
  if (!query) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const quote = await Devis.findOne(query);
  if (!quote) {
    return next(new ErrorResponse('Quote not found', 404));
  }

  const beforeJson = quote.toObject();
  quote.deletedAt = null;
  quote.deletedByUserId = null;
  quote.status = normalizeQuoteStatus(quote.status, QUOTE_STATUS.draft);
  quote.validUntil = getValidUntil(quote, quote.validUntil || quote.expiryDate);
  quote.expiryDate = quote.validUntil;
  await quote.save();

  await recordAudit({
    req,
    companyId: quote.companyId || quote.company,
    targetUserId: quote.ownerUserId,
    entityType: 'Quote',
    entityId: quote._id,
    action: 'RESTORE',
    beforeJson,
    afterJson: quote,
  });

  res.status(200).json({ success: true, data: quote });
});