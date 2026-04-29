import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const QUOTE_STATUS_MAP = {
  Draft: 'draft',
  Sent: 'sent',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Expired: 'expired',
  Invoiced: 'accepted',
  draft: 'draft',
  sent: 'sent',
  accepted: 'accepted',
  rejected: 'rejected',
  expired: 'expired',
};

const INVOICE_STATUS_MAP = {
  Unpaid: 'unpaid',
  'Partially Paid': 'unpaid',
  Paid: 'paid',
  Overdue: 'overdue',
  Cancelled: 'draft',
  draft: 'draft',
  sent: 'sent',
  unpaid: 'unpaid',
  paid: 'paid',
  overdue: 'overdue',
};

const normalizeQuoteStatus = (status) => QUOTE_STATUS_MAP[status] || 'draft';
const normalizeInvoiceStatus = (status) => INVOICE_STATUS_MAP[status] || 'draft';

const ensureDate = (value, fallback) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const quotesCollection = db.collection('devis');
  const invoicesCollection = db.collection('invoices');
  const paymentsCollection = db.collection('payments');
  const remindersCollection = db.collection('reminders');

  const quotes = await quotesCollection.find({}).toArray();
  for (const quote of quotes) {
    const validUntil = ensureDate(
      quote.validUntil || quote.expiryDate,
      new Date(new Date(quote.date || Date.now()).getTime() + 30 * 24 * 60 * 60 * 1000),
    );

    const updates = {
      status: normalizeQuoteStatus(quote.status),
      validUntil,
      expiryDate: validUntil,
    };

    if (!quote.companyId && quote.company) {
      updates.companyId = quote.company;
    }

    if (!quote.ownerUserId && quote.user) {
      updates.ownerUserId = quote.user;
    }

    await quotesCollection.updateOne({ _id: quote._id }, { $set: updates });
  }

  const invoices = await invoicesCollection.find({}).toArray();
  for (const invoice of invoices) {
    const totalAmount = Number(invoice.totalAmount || 0);
    const paidAmount = Math.min(Math.max(Number(invoice.paidAmount ?? invoice.amountPaid ?? 0), 0), totalAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);

    let status = normalizeInvoiceStatus(invoice.status);
    if (remainingAmount === 0 && totalAmount > 0) {
      status = 'paid';
    } else if (['sent', 'unpaid', 'overdue'].includes(status) && ensureDate(invoice.dueDate, null) && new Date(invoice.dueDate) < new Date()) {
      status = 'overdue';
    } else if (status === 'paid' && remainingAmount > 0) {
      status = 'unpaid';
    }

    const updates = {
      status,
      paidAmount,
      amountPaid: paidAmount,
      remainingAmount,
    };

    if (!invoice.companyId && invoice.company) {
      updates.companyId = invoice.company;
    }

    if (!invoice.ownerUserId && invoice.user) {
      updates.ownerUserId = invoice.user;
    }

    await invoicesCollection.updateOne({ _id: invoice._id }, { $set: updates });
  }

  const payments = await paymentsCollection.find({}).toArray();
  for (const payment of payments) {
    const invoice = payment.invoiceId ? await invoicesCollection.findOne({ _id: payment.invoiceId }) : null;
    const updates = {};

    if (!payment.companyId && (payment.company || invoice?.companyId || invoice?.company)) {
      updates.companyId = payment.company || invoice.companyId || invoice.company;
    }

    if (!payment.ownerUserId && invoice?.ownerUserId) {
      updates.ownerUserId = invoice.ownerUserId;
    }

    if (Object.keys(updates).length > 0) {
      await paymentsCollection.updateOne({ _id: payment._id }, { $set: updates });
    }
  }

  const reminders = await remindersCollection.find({}).toArray();
  for (const reminder of reminders) {
    const updates = {};
    if (!reminder.companyId && reminder.company) {
      updates.companyId = reminder.company;
    }

    if (Object.keys(updates).length > 0) {
      await remindersCollection.updateOne({ _id: reminder._id }, { $set: updates });
    }
  }

  console.log('Workflow migration completed.');
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error('Workflow migration failed:', error);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors
  }
  process.exit(1);
});
