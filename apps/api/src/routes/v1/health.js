const { Router } = require('express');
const { isConnected } = require('../../config/db');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    db: isConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
