const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ error: true, message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).lean();
    if (!user) {
      return res.status(401).json({ error: true, message: 'Authentication required' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: true, message: 'Authentication required' });
    }
    next(err);
  }
}

module.exports = authenticate;
