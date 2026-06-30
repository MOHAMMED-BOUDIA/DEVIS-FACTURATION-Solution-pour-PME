import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    default: 20,
  },
  total: {
    type: Number,
    required: true,
  },
});

const devisSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000),
  },
  expiryDate: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  items: [lineItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  taxAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  },
  notes: String,
  terms: String,
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

devisSchema.index({ companyId: 1, number: 1 }, { unique: true });
devisSchema.index({ company: 1, companyId: 1, ownerUserId: 1, deletedAt: 1 });

devisSchema.pre('validate', function syncValidUntil() {
  if (!this.validUntil && this.expiryDate) {
    this.validUntil = this.expiryDate;
  }

  if (!this.expiryDate && this.validUntil) {
    this.expiryDate = this.validUntil;
  }
});

const Devis = mongoose.model('Devis', devisSchema);

export default Devis;
