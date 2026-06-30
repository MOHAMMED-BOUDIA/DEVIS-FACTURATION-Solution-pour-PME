import Invoice from '../models/Invoice.js';
import Company from '../models/Company.js';
import Payment from '../models/Payment.js';
import Reminder from '../models/Reminder.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import { generateInvoicePDF } from '../utils/pdfService.js';
import { recordAudit } from '../utils/audit.js';
import { buildScopedQuery, getCompanyId, toObjectId } from '../utils/scope.js';

const INVOICE_STATUS = {
  draft: 'draft',
  sent: 'sent',
  unpaid: 'unpaid',
  paid: 'paid',
  overdue: 'overdue',
};

const LEGACY_INVOICE_STATUS_MAP = {
  Unpaid: INVOICE_STATUS.unpaid,
  'Partially Paid': INVOICE_STATUS.unpaid,
  Paid: INVOICE_STATUS.paid,
  Overdue: INVOICE_STATUS.overdue,
  Cancelled: INVOICE_STATUS.draft,
};

const normalizeInvoiceStatus = (status, fallback = INVOICE_STATUS.draft) => {
  if (!status) {
    return fallback;
  }

  if (LEGACY_INVOICE_STATUS_MAP[status]) {
    return LEGACY_INVOICE_STATUS_MAP[status];
  }

  const normalized = String(status).toLowerCase();
  return Object.values(INVOICE_STATUS).includes(normalized) ? normalized : fallback;
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

const buildInvoiceQuery = (req, extra = {}) => buildScopedQuery(req, extra);

const buildUniqueInvoiceNumber = async (company, companyId) => {
  const year = new Date().getFullYear();
  const prefix = company?.settings?.invoicePrefix || 'FACT-';
  let sequence = await Invoice.countDocuments({
    $or: [{ company: companyId }, { companyId }],
  });

  let candidate;
  let exists;
  do {
    sequence += 1;
    candidate = `${prefix}${year}-${String(sequence).padStart(4, '0')}`;
    exists = await Invoice.exists({ number: candidate });
  } while (exists);

  return candidate;
};

const computePaymentSnapshot = ({ totalAmount, paidAmount, dueDate, status }) => {
  const total = Number(totalAmount || 0);
  const paid = Math.min(Math.max(Number(paidAmount || 0), 0), total);
  const remaining = Math.max(total - paid, 0);
  let nextStatus = normalizeInvoiceStatus(status, INVOICE_STATUS.draft);

  if (remaining === 0 && total > 0) {
    nextStatus = INVOICE_STATUS.paid;
  } else if (nextStatus === INVOICE_STATUS.paid && remaining > 0) {
    nextStatus = INVOICE_STATUS.unpaid;
  }

  if (remaining > 0 && [INVOICE_STATUS.sent, INVOICE_STATUS.unpaid, INVOICE_STATUS.overdue].includes(nextStatus)) {
    const due = dueDate ? new Date(dueDate) : null;
    if (due && due < new Date()) {
      nextStatus = INVOICE_STATUS.overdue;
    } else if (nextStatus !== INVOICE_STATUS.sent) {
      nextStatus = INVOICE_STATUS.unpaid;
    }
  }

  return {
    paidAmount: paid,
    amountPaid: paid,
    remainingAmount: remaining,
    status: nextStatus,
  };
};

const syncInvoiceComputedFields = (invoice) => {
  const basePaidAmount = Number(
    invoice.paidAmount ?? invoice.amountPaid ?? 0,
  );

  const computed = computePaymentSnapshot({
    totalAmount: invoice.totalAmount,
    paidAmount: basePaidAmount,
    dueDate: invoice.dueDate,
    status: invoice.status,
  });

  invoice.paidAmount = computed.paidAmount;
  invoice.amountPaid = computed.amountPaid;
  invoice.remainingAmount = computed.remainingAmount;
  invoice.status = computed.status;
};

const refreshOverdueStatuses = async (req) => {
  const overdueQuery = buildInvoiceQuery(req, {
    deletedAt: null,
    status: { $in: [INVOICE_STATUS.sent, INVOICE_STATUS.unpaid] },
    dueDate: { $lt: new Date() },
    remainingAmount: { $gt: 0 },
  });

  if (!overdueQuery) {
    return;
  }

  await Invoice.updateMany(overdueQuery, {
    $set: { status: INVOICE_STATUS.overdue },
  });
};

// @desc    Generate PDF for invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private
export const getInvoicePDF = asyncHandler(async (req, res, next) => {
  const companyId = getCompanyId(req);
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: null });
  if (!companyId || !query) {
    return next(new ErrorResponse('Your account is not linked to any company.', 400));
  }

  await refreshOverdueStatuses(req);
  const invoice = await Invoice.findOne(query).populate('client');
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  syncInvoiceComputedFields(invoice);
  if (invoice.isModified()) {
    await invoice.save();
  }

  const company = await Company.findById(companyId);
  const pdfBuffer = await generateInvoicePDF(invoice, company);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.number}.pdf`);
  res.send(pdfBuffer);
});

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = buildInvoiceQuery(req, { deletedAt: null });
  if (!query) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  await refreshOverdueStatuses(req);
  if (status) {
    query.status = normalizeInvoiceStatus(status);
  }

  const invoices = await Invoice.find(query).populate('client').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: invoices.length, data: invoices });
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = asyncHandler(async (req, res, next) => {
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  await refreshOverdueStatuses(req);
  const invoice = await Invoice.findOne(query).populate('client');
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  syncInvoiceComputedFields(invoice);
  if (invoice.isModified()) {
    await invoice.save();
  }

  const payments = await Payment.find({
    invoiceId: invoice._id,
    deletedAt: null,
  }).sort({ paidAt: -1 }).lean();

  const invoiceData = invoice.toObject();
  invoiceData.payments = payments;
  res.status(200).json({ success: true, data: invoiceData });
});

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = asyncHandler(async (req, res, next) => {
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

  const number = req.body.number || await buildUniqueInvoiceNumber(company, companyId);

  const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : new Date(+new Date() + 30 * 24 * 60 * 60 * 1000);
  const initialStatus = normalizeInvoiceStatus(req.body.status, INVOICE_STATUS.draft);
  const paymentSnapshot = computePaymentSnapshot({
    totalAmount,
    paidAmount: Number(req.body.paidAmount ?? req.body.amountPaid ?? 0),
    dueDate,
    status: initialStatus,
  });

  const invoice = await Invoice.create({
    ...req.body,
    number,
    items,
    dueDate,
    company: companyId,
    companyId,
    ownerUserId: toObjectId(ownerUserId) || ownerUserId,
    subtotal,
    taxAmount,
    totalAmount,
    status: paymentSnapshot.status,
    paidAmount: paymentSnapshot.paidAmount,
    amountPaid: paymentSnapshot.amountPaid,
    remainingAmount: paymentSnapshot.remainingAmount,
  });

  await recordAudit({
    req,
    companyId,
    targetUserId: ownerUserId,
    entityType: 'Invoice',
    entityId: invoice._id,
    action: 'CREATE',
    afterJson: invoice,
  });

  res.status(201).json({ success: true, data: invoice });
});

// @desc    Send invoice
// @route   POST /api/invoices/:id/send
// @access  Private
export const sendInvoice = asyncHandler(async (req, res, next) => {
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const invoice = await Invoice.findOne(query);
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  syncInvoiceComputedFields(invoice);
  if (invoice.status === INVOICE_STATUS.paid) {
    return next(new ErrorResponse('Cannot send a paid invoice', 400));
  }

  const beforeJson = invoice.toObject();
  invoice.status = INVOICE_STATUS.sent;
  await invoice.save();

  await recordAudit({
    req,
    companyId: invoice.companyId,
    targetUserId: invoice.ownerUserId,
    entityType: 'Invoice',
    entityId: invoice._id,
    action: 'UPDATE',
    beforeJson,
    afterJson: invoice,
  });

  res.status(200).json({ success: true, data: invoice });
});

// @desc    Mark invoice as paid
// @route   POST /api/invoices/:id/mark-paid
// @access  Private
export const markInvoicePaid = asyncHandler(async (req, res, next) => {
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const invoice = await Invoice.findOne(query);
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const beforeJson = invoice.toObject();
  invoice.paidAmount = Number(invoice.totalAmount || 0);
  invoice.amountPaid = Number(invoice.totalAmount || 0);
  invoice.remainingAmount = 0;
  invoice.status = INVOICE_STATUS.paid;
  await invoice.save();

  await recordAudit({
    req,
    companyId: invoice.companyId,
    targetUserId: invoice.ownerUserId,
    entityType: 'Invoice',
    entityId: invoice._id,
    action: 'UPDATE',
    beforeJson,
    afterJson: invoice,
  });

  res.status(200).json({ success: true, data: invoice });
});

// @desc    Send payment reminder for invoice
// @route   POST /api/invoices/:id/remind
// @access  Private
export const remindInvoice = asyncHandler(async (req, res, next) => {
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const invoice = await Invoice.findOne(query).populate('client');
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  syncInvoiceComputedFields(invoice);
  if (![INVOICE_STATUS.sent, INVOICE_STATUS.unpaid, INVOICE_STATUS.overdue].includes(invoice.status) || invoice.remainingAmount <= 0) {
    return next(new ErrorResponse('Reminder can only be sent for unpaid or overdue invoices', 400));
  }

  const reminder = await Reminder.create({
    title: `Relance facture ${invoice.number}`,
    message: req.body.message || `Merci de regler la facture ${invoice.number}. Montant restant: ${Number(invoice.remainingAmount || 0).toLocaleString()} DH.`,
    dueDate: invoice.dueDate,
    status: 'Sent',
    company: invoice.companyId || invoice.company,
    companyId: invoice.companyId || invoice.company,
    ownerUserId: invoice.ownerUserId,
  });

  await recordAudit({
    req,
    companyId: invoice.companyId || invoice.company,
    targetUserId: invoice.ownerUserId,
    entityType: 'Reminder',
    entityId: reminder._id,
    action: 'CREATE',
    afterJson: reminder,
  });

  res.status(200).json({ success: true, data: reminder });
});

// @desc    Register payment for invoice
// @route   POST /api/invoices/:id/payments
// @access  Private
export const addPayment = asyncHandler(async (req, res, next) => {
  const { amount, method, reference, date } = req.body;
  const companyId = getCompanyId(req);
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: null });
  if (!companyId || !query) {
    return next(new ErrorResponse('Your account is not linked to any company.', 400));
  }

  const invoice = await Invoice.findOne(query);
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  syncInvoiceComputedFields(invoice);
  if (invoice.status === INVOICE_STATUS.paid) {
    return next(new ErrorResponse('Invoice already fully paid', 400));
  }

  const numericAmount = Number(amount || 0);
  if (numericAmount <= 0) {
    return next(new ErrorResponse('Payment amount must be greater than zero', 400));
  }

  const beforeJson = invoice.toObject();
  const payment = await Payment.create({
    company: companyId,
    companyId,
    ownerUserId: invoice.ownerUserId || (toObjectId(req.user.id || req.user._id) || (req.user.id || req.user._id)),
    invoiceId: invoice._id,
    amount: numericAmount,
    method: method || 'Other',
    reference,
    paidAt: date || new Date(),
  });

  const snapshot = computePaymentSnapshot({
    totalAmount: invoice.totalAmount,
    paidAmount: Number(invoice.paidAmount ?? invoice.amountPaid ?? 0) + numericAmount,
    dueDate: invoice.dueDate,
    status: invoice.status === INVOICE_STATUS.sent ? INVOICE_STATUS.unpaid : invoice.status,
  });

  invoice.paidAmount = snapshot.paidAmount;
  invoice.amountPaid = snapshot.amountPaid;
  invoice.remainingAmount = snapshot.remainingAmount;
  invoice.status = snapshot.status;
  await invoice.save();

  await recordAudit({
    req,
    companyId,
    targetUserId: invoice.ownerUserId,
    entityType: 'Invoice',
    entityId: invoice._id,
    action: 'UPDATE',
    beforeJson,
    afterJson: invoice,
  });

  await recordAudit({
    req,
    companyId,
    targetUserId: invoice.ownerUserId,
    entityType: 'Payment',
    entityId: payment._id,
    action: 'CREATE',
    afterJson: payment,
  });

  res.status(200).json({ success: true, data: invoice });
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = asyncHandler(async (req, res, next) => {
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const invoice = await Invoice.findOne(query);
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const beforeJson = invoice.toObject();
  const nextItems = req.body.items ? normalizeLineItems(req.body.items, invoice.companyId || invoice.company, invoice.ownerUserId) : null;
  const totals = nextItems ? calculateTotals(nextItems) : null;

  const updatableFields = (({ company, companyId, ownerUserId, deletedAt, deletedByUserId, paidAmount, amountPaid, remainingAmount, ...rest }) => rest)(req.body);
  Object.assign(invoice, updatableFields);
  if (nextItems) {
    invoice.items = nextItems;
    invoice.subtotal = totals.subtotal;
    invoice.taxAmount = totals.taxAmount;
    invoice.totalAmount = totals.subtotal + totals.taxAmount;
  }

  invoice.company = invoice.company || getCompanyId(req);
  invoice.companyId = invoice.companyId || getCompanyId(req);
  invoice.status = normalizeInvoiceStatus(req.body.status, invoice.status);

  const snapshot = computePaymentSnapshot({
    totalAmount: invoice.totalAmount,
    paidAmount: Number(invoice.paidAmount ?? invoice.amountPaid ?? 0),
    dueDate: invoice.dueDate,
    status: invoice.status,
  });

  invoice.paidAmount = snapshot.paidAmount;
  invoice.amountPaid = snapshot.amountPaid;
  invoice.remainingAmount = snapshot.remainingAmount;
  invoice.status = snapshot.status;

  await invoice.save();

  await recordAudit({
    req,
    companyId: invoice.companyId,
    targetUserId: invoice.ownerUserId,
    entityType: 'Invoice',
    entityId: invoice._id,
    action: 'UPDATE',
    beforeJson,
    afterJson: invoice,
  });

  res.status(200).json({ success: true, data: invoice });
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = asyncHandler(async (req, res, next) => {
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: null });
  if (!query) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const invoice = await Invoice.findOne(query);
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const beforeJson = invoice.toObject();
  invoice.deletedAt = new Date();
  invoice.deletedByUserId = req.user.id || req.user._id;
  await invoice.save();

  await recordAudit({
    req,
    companyId: invoice.companyId || invoice.company,
    targetUserId: invoice.ownerUserId,
    entityType: 'Invoice',
    entityId: invoice._id,
    action: 'DELETE',
    beforeJson,
    afterJson: invoice,
  });

  res.status(200).json({ success: true, data: {} });
});

export const restoreInvoice = asyncHandler(async (req, res, next) => {
  const query = buildInvoiceQuery(req, { _id: req.params.id, deletedAt: { $ne: null } });
  if (!query) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const invoice = await Invoice.findOne(query);
  if (!invoice) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  const beforeJson = invoice.toObject();
  invoice.deletedAt = null;
  invoice.deletedByUserId = null;
  syncInvoiceComputedFields(invoice);
  await invoice.save();

  await recordAudit({
    req,
    companyId: invoice.companyId || invoice.company,
    targetUserId: invoice.ownerUserId,
    entityType: 'Invoice',
    entityId: invoice._id,
    action: 'RESTORE',
    beforeJson,
    afterJson: invoice,
  });

  res.status(200).json({ success: true, data: invoice });
});