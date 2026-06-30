import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  entityType: {
    type: String,
    required: true,
    index: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'],
    required: true,
    index: true,
  },
  beforeJson: mongoose.Schema.Types.Mixed,
  afterJson: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
}, {
  timestamps: true,
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
