import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  method: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Check', 'Other'],
    default: 'Other',
  },
  reference: String,
  paidAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
