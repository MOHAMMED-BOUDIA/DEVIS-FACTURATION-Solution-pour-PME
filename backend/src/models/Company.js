import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
  },
  address: String,
  taxId: {
    type: String,
    required: [true, 'Please add a tax ID (ICE/IF)'],
  },
  phone: String,
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  logoUrl: String,
  settings: {
    currency: {
      type: String,
      default: 'DH',
    },
    defaultVat: {
      type: Number,
      default: 20,
    },
    quotePrefix: {
      type: String,
      default: 'DEVIS-',
    },
    invoicePrefix: {
      type: String,
      default: 'FACT-',
    },
  },
}, {
  timestamps: true,
});

const Company = mongoose.model('Company', companySchema);

export default Company;
