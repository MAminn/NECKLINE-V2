const { Router } = require('express');
const FeatureFlag = require('../../../models/FeatureFlag');
const { isEnabled, setEnabled } = require('../../../domain/features');
const { createAuditEvent } = require('../../../domain/audit');

const router = Router();

router.get('/list', async (req, res, next) => {
  try {
    const flags = await FeatureFlag.find().sort({ name: 1 }).lean();
    res.json({ flags });
  } catch (err) {
    next(err);
  }
});

router.post('/:name/toggle', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { enabled } = req.body;
    const changedBy = req.headers['x-admin-id'] || 'unknown';

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: true, message: 'enabled must be a boolean' });
    }

    const { before, after } = await setEnabled(name, enabled, changedBy);

    await createAuditEvent({
      actor: changedBy,
      action: `feature_flag_${enabled ? 'enabled' : 'disabled'}`,
      target: name,
      targetType: 'FeatureFlag',
      before,
      after,
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, flag: after });
  } catch (err) {
    next(err);
  }
});

router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const enabled = await isEnabled(name);
    res.json({ name, enabled });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
