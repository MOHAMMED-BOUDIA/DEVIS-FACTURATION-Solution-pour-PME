import AuditLog from '../models/AuditLog.js';

const safeJson = (value) => {
  if (value == null) return null;
  return JSON.parse(JSON.stringify(value));
};

export const recordAudit = async ({
  req,
  companyId,
  targetUserId = null,
  entityType,
  entityId,
  action,
  beforeJson = null,
  afterJson = null,
}) => {
  try {
    if (!companyId || !entityType || !entityId || !action || !req?.user) {
      return;
    }

    await AuditLog.create({
      companyId,
      actorUserId: req.user.id || req.user._id,
      targetUserId,
      entityType,
      entityId,
      action,
      beforeJson: safeJson(beforeJson),
      afterJson: safeJson(afterJson),
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};
