import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  description: String,
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    default: 0,
  },
  unit: {
    type: String,
    enum: ['Unit', 'Hour', 'Day', 'kg', 'm2', 'm3'],
    default: 'Unit',
  },
  taxRate: {
    type: Number,
    default: 20, // 20% VAT is common in Morocco
  },
  category: String,
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
  isActive: {
    type: Boolean,
    default: true,
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

productSchema.index({ company: 1, companyId: 1, ownerUserId: 1, deletedAt: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
