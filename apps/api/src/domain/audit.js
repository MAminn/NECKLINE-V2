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

// Fire-and-forget kernel: persist the event but never let an audit failure
// break the request/operation it describes. Both emitters below delegate here
// so the swallow-and-log behaviour lives in exactly one place.
function dispatchAudit(details) {
  return createAuditEvent(details).catch((err) => logger.error({ err }, 'Audit event failed'));
}

// For authenticated routes: derives actor/requestId/ip/userAgent from the
// Express request.
function emitAudit(req, { action, target, targetType, before, after }) {
  return dispatchAudit({
    actor: req.user?.id,
    action,
    target,
    targetType,
    before,
    after,
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
}

// For services that receive a request `meta` ({ requestId, ip, userAgent })
// instead of the raw request, and resolve `actor` themselves. No-ops when there
// is no requestId (matching the previous inline `if (meta.requestId)` guards).
function emitAuditFromMeta(meta = {}, { actor, action, target, targetType, before, after }) {
  if (!meta.requestId) return undefined;
  return dispatchAudit({
    actor,
    action,
    target,
    targetType,
    before,
    after,
    requestId: meta.requestId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
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

module.exports = { createAuditEvent, emitAudit, emitAuditFromMeta };
