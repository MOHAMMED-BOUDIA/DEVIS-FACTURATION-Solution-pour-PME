import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: String,
  dueDate: Date,
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Done'],
    default: 'Pending',
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
  },
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
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

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;
