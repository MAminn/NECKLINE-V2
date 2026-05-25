const AuditEvent = require('../models/AuditEvent');
const logger = require('../config/logger');

async function createAuditEvent({ actor, action, target, targetType, before, after, requestId, ip, userAgent }) {
  const diff = computeDiff(before, after);

  const event = await AuditEvent.create({
    actor,
    action,
    target,
    targetType,
    before,
    after,
    diff,
    requestId,
    ip,
    userAgent,
  });

  logger.info({ auditId: event._id, action, target }, 'Audit event created');
  return event;
}

function computeDiff(before, after) {
  if (!before || !after) return null;
  const diff = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = { before: before[key], after: after[key] };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}

module.exports = { createAuditEvent };
