import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a client name'],
    trim: true,
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  phone: String,
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Morocco'
    },
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
  taxNumber: String, // ICE for Morocco
  notes: String,
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

clientSchema.index({ company: 1, companyId: 1, ownerUserId: 1, deletedAt: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
